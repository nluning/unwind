import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { getApp, truncateAll, closeApp } from './setup.js'

// Mock the Anthropic SDK so the route doesn't hit the real API in tests.
// `vi.hoisted` lets us share the mock fn between the factory and the tests.
const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }))

vi.mock('@anthropic-ai/sdk', () => ({
  default: class FakeAnthropic {
    messages = { create: mockCreate }
  },
}))

function buildFakeResponse() {
  const payload = {
    activities: [
      {
        title: 'Teken iets',
        description: 'Krabbel wat in een schetsboek',
        category: 'Hands',
        duration_minutes: 10,
        min_stress: 1,
        max_stress: 3,
      },
    ],
    memories: ['Houdt van tekenen'],
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(payload) }],
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

describe('Onboarding completion stamping', () => {
  it('stamps onboarding_completed_at on first successful generate', async () => {
    mockCreate.mockResolvedValueOnce(buildFakeResponse())

    const response = await app.inject({
      method: 'POST',
      url: '/onboarding/generate',
      headers: { cookie },
      payload: {
        setting: 'indoor',
        social: 'alone',
        interests: ['Creatief'],
        memory_consent: false,
      },
    })

    expect(response.statusCode).toBe(201)

    const result = await app.pg.query(
      'SELECT onboarding_completed_at FROM users WHERE id = $1',
      [userId]
    )
    expect(result.rows[0].onboarding_completed_at).not.toBeNull()
  })

  it('does not overwrite onboarding_completed_at on a second (refresh) run', async () => {
    mockCreate.mockResolvedValue(buildFakeResponse())

    const firstResponse = await app.inject({
      method: 'POST',
      url: '/onboarding/generate',
      headers: { cookie },
      payload: {
        setting: 'indoor',
        social: 'alone',
        interests: ['Creatief'],
        memory_consent: false,
      },
    })
    expect(firstResponse.statusCode).toBe(201)

    const firstStamp = await app.pg.query(
      'SELECT onboarding_completed_at FROM users WHERE id = $1',
      [userId]
    )
    const originalTimestamp = firstStamp.rows[0].onboarding_completed_at as Date

    // Wait a tick so any overwrite would produce a different now()
    await new Promise((resolve) => setTimeout(resolve, 20))

    const secondResponse = await app.inject({
      method: 'POST',
      url: '/onboarding/generate',
      headers: { cookie },
      payload: {
        setting: 'outdoor',
        social: 'with_others',
        interests: ['Wandelen'],
        memory_consent: false,
      },
    })
    expect(secondResponse.statusCode).toBe(201)

    const secondStamp = await app.pg.query(
      'SELECT onboarding_completed_at FROM users WHERE id = $1',
      [userId]
    )
    const refreshTimestamp = secondStamp.rows[0].onboarding_completed_at as Date

    expect(refreshTimestamp.getTime()).toBe(originalTimestamp.getTime())
  })

  it('stamps onboarding_completed_at when the user skips', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/onboarding/skip',
      headers: { cookie },
    })

    expect(response.statusCode).toBe(204)

    const result = await app.pg.query(
      'SELECT onboarding_completed_at FROM users WHERE id = $1',
      [userId]
    )
    expect(result.rows[0].onboarding_completed_at).not.toBeNull()

    // And no activities or memories were created
    const activityCount = await app.pg.query(
      'SELECT count(*)::int AS count FROM activities WHERE user_id = $1',
      [userId]
    )
    expect(activityCount.rows[0].count).toBe(0)
  })

  it('does not overwrite onboarding_completed_at when a completed user calls skip', async () => {
    mockCreate.mockResolvedValueOnce(buildFakeResponse())
    await app.inject({
      method: 'POST',
      url: '/onboarding/generate',
      headers: { cookie },
      payload: {
        setting: 'indoor',
        social: 'alone',
        interests: ['Creatief'],
        memory_consent: false,
      },
    })

    const firstStamp = await app.pg.query(
      'SELECT onboarding_completed_at FROM users WHERE id = $1',
      [userId]
    )
    const originalTimestamp = firstStamp.rows[0].onboarding_completed_at as Date

    await new Promise((resolve) => setTimeout(resolve, 20))

    const skipResponse = await app.inject({
      method: 'POST',
      url: '/onboarding/skip',
      headers: { cookie },
    })
    expect(skipResponse.statusCode).toBe(204)

    const secondStamp = await app.pg.query(
      'SELECT onboarding_completed_at FROM users WHERE id = $1',
      [userId]
    )
    const afterSkipTimestamp = secondStamp.rows[0].onboarding_completed_at as Date

    expect(afterSkipTimestamp.getTime()).toBe(originalTimestamp.getTime())
  })

  it('appends activities on a refresh instead of replacing them', async () => {
    mockCreate.mockResolvedValue(buildFakeResponse())

    await app.inject({
      method: 'POST',
      url: '/onboarding/generate',
      headers: { cookie },
      payload: {
        setting: 'indoor',
        social: 'alone',
        interests: ['Creatief'],
        memory_consent: false,
      },
    })

    await app.inject({
      method: 'POST',
      url: '/onboarding/generate',
      headers: { cookie },
      payload: {
        setting: 'outdoor',
        social: 'with_others',
        interests: ['Wandelen'],
        memory_consent: false,
      },
    })

    const activityCount = await app.pg.query(
      "SELECT count(*)::int AS count FROM activities WHERE user_id = $1 AND source = 'ai'",
      [userId]
    )
    // Each fake response has one activity → two runs → two rows
    expect(activityCount.rows[0].count).toBe(2)
  })
})
