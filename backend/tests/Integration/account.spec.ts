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

// ---------- shape of auth responses ----------

describe('auth responses', () => {
  it('register returns memory_enabled', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/register',
      payload: { email: 'fresh@example.com', password: 'password123' },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json().memory_enabled).toBe(false)
  })

  it('login returns memory_enabled', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/login',
      payload: { email: 'test@example.com', password: 'password123' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().memory_enabled).toBe(false)
  })

  it('/me returns memory_enabled', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/me',
      headers: { cookie },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().memory_enabled).toBe(false)
  })

  it('/auth/device returns memory_enabled', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/device',
      payload: { device_id: 'fresh-device-id' },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json().memory_enabled).toBe(false)
  })
})

// ---------- PATCH /me ----------

describe('PATCH /me', () => {
  it('enables memory', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/me',
      headers: { cookie },
      payload: { memory_enabled: true },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ memory_enabled: true })

    const row = await app.pg.query('SELECT memory_enabled FROM users WHERE id = $1', [userId])
    expect(row.rows[0].memory_enabled).toBe(true)
  })

  it('disables memory and wipes existing user_memories in one transaction', async () => {
    await app.pg.query('UPDATE users SET memory_enabled = true WHERE id = $1', [userId])
    for (const fact of ['fact a', 'fact b', 'fact c']) {
      await app.pg.query(
        "INSERT INTO user_memories (user_id, fact, source) VALUES ($1, $2, 'user_added')",
        [userId, fact]
      )
    }

    const response = await app.inject({
      method: 'PATCH',
      url: '/me',
      headers: { cookie },
      payload: { memory_enabled: false },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ memory_enabled: false })

    const userRow = await app.pg.query('SELECT memory_enabled FROM users WHERE id = $1', [userId])
    expect(userRow.rows[0].memory_enabled).toBe(false)

    const memoryRows = await app.pg.query('SELECT id FROM user_memories WHERE user_id = $1', [userId])
    expect(memoryRows.rows).toHaveLength(0)
  })

  it('re-enabling does not restore previously deleted memories', async () => {
    await app.pg.query('UPDATE users SET memory_enabled = true WHERE id = $1', [userId])
    await app.pg.query(
      "INSERT INTO user_memories (user_id, fact, source) VALUES ($1, 'gone', 'user_added')",
      [userId]
    )

    await app.inject({
      method: 'PATCH',
      url: '/me',
      headers: { cookie },
      payload: { memory_enabled: false },
    })

    const reEnable = await app.inject({
      method: 'PATCH',
      url: '/me',
      headers: { cookie },
      payload: { memory_enabled: true },
    })

    expect(reEnable.statusCode).toBe(200)

    const rows = await app.pg.query('SELECT id FROM user_memories WHERE user_id = $1', [userId])
    expect(rows.rows).toHaveLength(0)
  })

  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/me',
      payload: { memory_enabled: true },
    })

    expect(response.statusCode).toBe(401)
  })

  it('rejects non-boolean memory_enabled', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/me',
      headers: { cookie },
      payload: { memory_enabled: 'yes' },
    })

    expect(response.statusCode).toBe(400)
  })
})
