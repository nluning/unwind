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

function fakeResponse() {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          activity: {
            title: 'Adem vijf keer langzaam',
            description: 'Tel je adem.',
            category: 'Head',
            duration_minutes: 5,
            min_stress: 1,
            max_stress: 5,
          },
        }),
      },
    ],
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

describe('POST /activities/suggest-from-answers', () => {
  it('returns a single generated activity', async () => {
    mockCreate.mockResolvedValueOnce(fakeResponse())

    const response = await app.inject({
      method: 'POST',
      url: '/activities/suggest-from-answers',
      headers: { cookie },
      payload: { location: 'indoor', social: 'alone', energy: 'calm' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().activity.title).toBe('Adem vijf keer langzaam')
  })

  it('maps the tap-answers into the prompt as constraints', async () => {
    mockCreate.mockResolvedValueOnce(fakeResponse())

    await app.inject({
      method: 'POST',
      url: '/activities/suggest-from-answers',
      headers: { cookie },
      payload: { location: 'outdoor', social: 'with_others', energy: 'active' },
    })

    const sentMessage = mockCreate.mock.calls[0]![0].messages[0].content as string
    expect(sentMessage).toContain('Buiten')
    expect(sentMessage).toContain('Met iemand')
    expect(sentMessage).toContain('Iets actiefs')
  })

  it('still suggests from history alone when all questions are skipped', async () => {
    mockCreate.mockResolvedValueOnce(fakeResponse())

    const response = await app.inject({
      method: 'POST',
      url: '/activities/suggest-from-answers',
      headers: { cookie },
      payload: {}, // every question skipped ("maakt niet uit")
    })

    expect(response.statusCode).toBe(200)
    // Fresh user + no answers → cold-start instruction, never an "add more" gate.
    const sentMessage = mockCreate.mock.calls[0]![0].messages[0].content as string
    expect(sentMessage).toContain('nieuw')
  })

  it('does NOT persist the draft — the client saves it separately', async () => {
    mockCreate.mockResolvedValueOnce(fakeResponse())

    await app.inject({
      method: 'POST',
      url: '/activities/suggest-from-answers',
      headers: { cookie },
      payload: { energy: 'calm' },
    })

    const count = await app.pg.query(
      'SELECT count(*)::int AS count FROM activities WHERE user_id = $1',
      [userId]
    )
    expect(count.rows[0].count).toBe(0)
  })

  it('rejects an invalid answer value (schema enum)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/activities/suggest-from-answers',
      headers: { cookie },
      payload: { location: 'space' },
    })

    expect(response.statusCode).toBe(400)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns 502 when the model output cannot be parsed', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'geen JSON hier' }],
      usage: { input_tokens: 0, output_tokens: 0 },
    })

    const response = await app.inject({
      method: 'POST',
      url: '/activities/suggest-from-answers',
      headers: { cookie },
      payload: { location: 'indoor' },
    })

    expect(response.statusCode).toBe(502)
  })

  it('rate-limits after the daily cap (10/day)', async () => {
    for (let index = 0; index < 10; index++) {
      await app.pg.query(
        `INSERT INTO api_usage (user_id, endpoint) VALUES ($1, 'suggest_from_answers')`,
        [userId]
      )
    }

    const response = await app.inject({
      method: 'POST',
      url: '/activities/suggest-from-answers',
      headers: { cookie },
      payload: { energy: 'calm' },
    })

    expect(response.statusCode).toBe(429)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('requires authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/activities/suggest-from-answers',
      payload: { energy: 'calm' },
    })
    expect(response.statusCode).toBe(401)
  })
})
