import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { getApp, truncateAll, closeApp } from './setup.js'

// Mock the Anthropic SDK so the route doesn't hit the real API in tests.
const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }))

vi.mock('@anthropic-ai/sdk', () => ({
  default: class FakeAnthropic {
    messages = { create: mockCreate }
  },
}))

function fakeResponse(count = 3) {
  const activities = Array.from({ length: count }, (_unused, index) => ({
    title: `Suggestie ${index}`,
    description: 'Iets rustigs',
    category: 'Head',
    duration_minutes: 10,
    min_stress: 1,
    max_stress: 4,
  }))
  return {
    content: [{ type: 'text', text: JSON.stringify({ activities }) }],
    usage: { input_tokens: 0, output_tokens: 0 },
  }
}

let app: FastifyInstance
let cookie: string
let userId: string

beforeAll(async () => {
  app = await getApp()
})

beforeEach(async () => {
  await truncateAll(app)
  mockCreate.mockReset()

  const registerResponse = await app.inject({
    method: 'POST',
    url: '/register',
    payload: { email: 'test@example.com', password: 'password123' },
  })
  userId = registerResponse.json().id

  const rawCookies = registerResponse.headers['set-cookie']
  const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies]
  cookie = cookies.find((header) => header?.startsWith('session='))!.split(';')[0]
})

afterAll(async () => {
  await closeApp()
})

describe('POST /activities/suggest-from-list', () => {
  it('returns the generated suggestions', async () => {
    mockCreate.mockResolvedValueOnce(fakeResponse(3))

    const response = await app.inject({
      method: 'POST',
      url: '/activities/suggest-from-list',
      headers: { cookie },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().activities).toHaveLength(3)
  })

  it('does NOT persist the drafts — the client saves chosen ones separately', async () => {
    mockCreate.mockResolvedValueOnce(fakeResponse(3))

    await app.inject({
      method: 'POST',
      url: '/activities/suggest-from-list',
      headers: { cookie },
    })

    const count = await app.pg.query(
      'SELECT count(*)::int AS count FROM activities WHERE user_id = $1',
      [userId]
    )
    expect(count.rows[0].count).toBe(0)
  })

  it('sends a cold-start prompt when the user has no register yet', async () => {
    mockCreate.mockResolvedValueOnce(fakeResponse(3))

    await app.inject({
      method: 'POST',
      url: '/activities/suggest-from-list',
      headers: { cookie },
    })

    expect(mockCreate).toHaveBeenCalledOnce()
    const sentMessage = mockCreate.mock.calls[0]![0].messages[0].content as string
    expect(sentMessage).toContain('nieuw')
  })

  it('returns 502 when the model output cannot be parsed', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'geen JSON hier' }],
      usage: { input_tokens: 0, output_tokens: 0 },
    })

    const response = await app.inject({
      method: 'POST',
      url: '/activities/suggest-from-list',
      headers: { cookie },
    })

    expect(response.statusCode).toBe(502)
  })

  it('rate-limits after the daily cap (10/day)', async () => {
    // Pre-fill the day's usage so the next call is the 11th.
    for (let index = 0; index < 10; index++) {
      await app.pg.query(
        `INSERT INTO api_usage (user_id, endpoint) VALUES ($1, 'suggest_from_list')`,
        [userId]
      )
    }

    const response = await app.inject({
      method: 'POST',
      url: '/activities/suggest-from-list',
      headers: { cookie },
    })

    expect(response.statusCode).toBe(429)
    expect(mockCreate).not.toHaveBeenCalled() // limiter short-circuits before the API call
  })

  it('requires authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/activities/suggest-from-list',
    })
    expect(response.statusCode).toBe(401)
  })
})
