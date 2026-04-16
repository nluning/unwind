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

// ---------- helpers ----------

async function enableMemory() {
  await app.pg.query('UPDATE users SET memory_enabled = true WHERE id = $1', [userId])
}

async function createMemory(fact: string, source = 'user_added') {
  return app.inject({
    method: 'POST',
    url: '/memories',
    headers: { cookie },
    payload: { fact, source },
  })
}

// ---------- GET /memories ----------

describe('GET /memories', () => {
  it('returns empty array when no memories exist', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/memories',
      headers: { cookie },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([])
  })

  it('returns the user\'s memories', async () => {
    await enableMemory()
    await createMemory('Likes reading')
    await createMemory('Prefers indoor')

    const response = await app.inject({
      method: 'GET',
      url: '/memories',
      headers: { cookie },
    })

    expect(response.statusCode).toBe(200)
    const memories = response.json()
    expect(memories).toHaveLength(2)
    expect(memories[0].fact).toBe('Likes reading')
    expect(memories[1].fact).toBe('Prefers indoor')
  })

  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/memories',
    })

    expect(response.statusCode).toBe(401)
  })
})

// ---------- POST /memories ----------

describe('POST /memories', () => {
  it('returns 403 when memory is not enabled', async () => {
    const response = await createMemory('Should fail')

    expect(response.statusCode).toBe(403)
    expect(response.json().error).toBe('Memory is not enabled for this account.')
  })

  it('creates a memory when enabled', async () => {
    await enableMemory()
    const response = await createMemory('Has ADHD')

    expect(response.statusCode).toBe(201)
    const body = response.json()
    expect(body.fact).toBe('Has ADHD')
    expect(body.source).toBe('user_added')
    expect(body.id).toBeDefined()
  })

  it('enforces the 30-memory cap', async () => {
    await enableMemory()

    // Insert 30 memories directly
    for (let index = 0; index < 30; index++) {
      await app.pg.query(
        "INSERT INTO user_memories (user_id, fact, source) VALUES ($1, $2, 'user_added')",
        [userId, `Fact ${index}`]
      )
    }

    const response = await createMemory('One too many')

    expect(response.statusCode).toBe(409)
    expect(response.json().error).toBe('Memory limit reached.')
  })

  it('validates required fields', async () => {
    await enableMemory()
    const response = await app.inject({
      method: 'POST',
      url: '/memories',
      headers: { cookie },
      payload: { fact: 'Missing source' },
    })

    expect(response.statusCode).toBe(400)
  })
})

// ---------- POST /memories/batch ----------

describe('POST /memories/batch', () => {
  it('returns 403 when memory is not enabled', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/memories/batch',
      headers: { cookie },
      payload: { facts: ['Fact 1', 'Fact 2'], source: 'onboarding' },
    })

    expect(response.statusCode).toBe(403)
  })

  it('creates multiple memories in one request', async () => {
    await enableMemory()

    const response = await app.inject({
      method: 'POST',
      url: '/memories/batch',
      headers: { cookie },
      payload: {
        facts: ['Likes indoor', 'Has ADHD', 'Prefers alone'],
        source: 'onboarding',
      },
    })

    expect(response.statusCode).toBe(201)
    const memories = response.json()
    expect(memories).toHaveLength(3)
    expect(memories[0].fact).toBe('Likes indoor')
    expect(memories[0].source).toBe('onboarding')
  })

  it('truncates to remaining capacity', async () => {
    await enableMemory()

    // Insert 28 memories directly
    for (let index = 0; index < 28; index++) {
      await app.pg.query(
        "INSERT INTO user_memories (user_id, fact, source) VALUES ($1, $2, 'user_added')",
        [userId, `Fact ${index}`]
      )
    }

    const response = await app.inject({
      method: 'POST',
      url: '/memories/batch',
      headers: { cookie },
      payload: {
        facts: ['A', 'B', 'C', 'D', 'E'],
        source: 'onboarding',
      },
    })

    expect(response.statusCode).toBe(201)
    // Only 2 should fit (30 - 28 = 2)
    expect(response.json()).toHaveLength(2)
  })
})

// ---------- PUT /memories/:id ----------

describe('PUT /memories/:id', () => {
  it('updates a memory fact', async () => {
    await enableMemory()
    const created = (await createMemory('Old fact')).json()

    const response = await app.inject({
      method: 'PUT',
      url: `/memories/${created.id}`,
      headers: { cookie },
      payload: { fact: 'Updated fact' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().fact).toBe('Updated fact')
  })

  it('returns 404 for non-existent memory', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/memories/00000000-0000-0000-0000-000000000000',
      headers: { cookie },
      payload: { fact: 'Ghost' },
    })

    expect(response.statusCode).toBe(404)
  })
})

// ---------- DELETE /memories/:id ----------

describe('DELETE /memories/:id', () => {
  it('deletes a memory', async () => {
    await enableMemory()
    const created = (await createMemory('To be deleted')).json()

    const response = await app.inject({
      method: 'DELETE',
      url: `/memories/${created.id}`,
      headers: { cookie },
    })

    expect(response.statusCode).toBe(200)

    // Verify it's gone
    const check = await app.pg.query('SELECT * FROM user_memories WHERE id = $1', [created.id])
    expect(check.rows).toHaveLength(0)
  })

  it('returns 404 for non-existent memory', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/memories/00000000-0000-0000-0000-000000000000',
      headers: { cookie },
    })

    expect(response.statusCode).toBe(404)
  })
})
