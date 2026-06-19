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

  it('anchors the prompt to a seed activity owned by the user', async () => {
    mockCreate.mockResolvedValueOnce(fakeResponse(3))

    const seed = await app.pg.query<{ id: string }>(
      `INSERT INTO activities (title, description, suggested_duration, min_stress_level, max_stress_level, source, user_id)
       VALUES ('Lees een boek', 'Een half uur fictie', 30, 1, 5, 'user', $1) RETURNING id`,
      [userId]
    )

    const response = await app.inject({
      method: 'POST',
      url: '/activities/suggest-from-list',
      headers: { cookie },
      payload: { seed_activity_id: seed.rows[0]!.id },
    })

    expect(response.statusCode).toBe(200)
    const sentMessage = mockCreate.mock.calls[0]![0].messages[0].content as string
    expect(sentMessage).toContain('Lees een boek')
    expect(sentMessage).toContain('in de geest van')
  })

  it('drops the seed and falls back to a generic prompt when it belongs to someone else', async () => {
    mockCreate.mockResolvedValueOnce(fakeResponse(3))

    // A second user's private activity — not visible to our user.
    const other = await app.inject({
      method: 'POST',
      url: '/register',
      payload: { email: 'other@example.com', password: 'password123' },
    })
    const otherUserId = other.json().id
    const seed = await app.pg.query<{ id: string }>(
      `INSERT INTO activities (title, description, suggested_duration, min_stress_level, max_stress_level, source, user_id)
       VALUES ('Geheime activiteit', null, 30, 1, 5, 'user', $1) RETURNING id`,
      [otherUserId]
    )

    const response = await app.inject({
      method: 'POST',
      url: '/activities/suggest-from-list',
      headers: { cookie },
      payload: { seed_activity_id: seed.rows[0]!.id },
    })

    expect(response.statusCode).toBe(200)
    const sentMessage = mockCreate.mock.calls[0]![0].messages[0].content as string
    expect(sentMessage).not.toContain('Geheime activiteit')
    expect(sentMessage).not.toContain('in de geest van')
  })

  it('rejects a non-uuid seed_activity_id', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/activities/suggest-from-list',
      headers: { cookie },
      payload: { seed_activity_id: 'not-a-uuid' },
    })

    expect(response.statusCode).toBe(400)
    expect(mockCreate).not.toHaveBeenCalled()
  })
})
