import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { getApp, truncateAll, closeApp } from './setup.js'

let app: FastifyInstance
let cookie: string
let userId: string

beforeAll(async () => {
  app = await getApp()
})

beforeEach(async () => {
  await truncateAll(app)

  const response = await app.inject({
    method: 'POST',
    url: '/register',
    payload: { email: 'test@example.com', password: 'password123' },
  })
  userId = response.json().id

  const raw = response.headers['set-cookie']
  const cookies = Array.isArray(raw) ? raw : [raw]
  cookie = cookies.find((header) => header?.startsWith('session='))!.split(';')[0]
})

afterAll(async () => {
  await closeApp()
})

// ---------- Chat rate limiting ----------

describe('Chat rate limiting', () => {
  it('records usage in api_usage table', async () => {
    // The chat endpoint will fail because there's no real Claude API in tests,
    // but the rate limiter runs BEFORE the handler — so usage gets recorded
    await app.inject({
      method: 'POST',
      url: '/chat',
      headers: { cookie },
      payload: {
        messages: [{ role: 'user', content: 'hello' }],
      },
    })

    const result = await app.pg.query(
      "SELECT count(*)::int AS count FROM api_usage WHERE user_id = $1 AND endpoint = 'chat'",
      [userId]
    )

    expect(result.rows[0].count).toBe(1)
  })

  it('returns 429 after 70 chat requests in a day', async () => {
    // Seed 70 usage records directly (faster than making 70 requests)
    for (let index = 0; index < 70; index++) {
      await app.pg.query(
        "INSERT INTO api_usage (user_id, endpoint) VALUES ($1, 'chat')",
        [userId]
      )
    }

    const response = await app.inject({
      method: 'POST',
      url: '/chat',
      headers: { cookie },
      payload: {
        messages: [{ role: 'user', content: 'hello' }],
      },
    })

    expect(response.statusCode).toBe(429)
    expect(response.json().error).toContain('limiet')
  })

  it('does not count onboarding usage against chat limit', async () => {
    // Seed 70 onboarding records
    for (let index = 0; index < 70; index++) {
      await app.pg.query(
        "INSERT INTO api_usage (user_id, endpoint) VALUES ($1, 'onboarding')",
        [userId]
      )
    }

    // Chat should still work (the request will fail at Claude API, but not at rate limit)
    const response = await app.inject({
      method: 'POST',
      url: '/chat',
      headers: { cookie },
      payload: {
        messages: [{ role: 'user', content: 'hello' }],
      },
    })

    // Should NOT be 429 — it'll be 503 (Claude API not available in tests)
    expect(response.statusCode).not.toBe(429)
  })
})

// ---------- Onboarding rate limiting ----------

describe('Onboarding rate limiting', () => {
  it('returns 429 after 3 onboarding attempts', async () => {
    // Seed 3 usage records
    for (let index = 0; index < 3; index++) {
      await app.pg.query(
        "INSERT INTO api_usage (user_id, endpoint) VALUES ($1, 'onboarding')",
        [userId]
      )
    }

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

    expect(response.statusCode).toBe(429)
    expect(response.json().error).toContain('maximaal')
  })
})
