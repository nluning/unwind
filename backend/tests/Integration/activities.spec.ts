import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { getApp, truncateAll, closeApp } from './setup.js'

let app: FastifyInstance
let cookie: string

beforeAll(async () => {
  app = await getApp()
})

beforeEach(async () => {
  await truncateAll(app)
  // Every test needs an authenticated user
  const response = await app.inject({
    method: 'POST',
    url: '/register',
    payload: { email: 'test@example.com', password: 'password123' },
  })
  const raw = response.headers['set-cookie']
  const cookies = Array.isArray(raw) ? raw : [raw]
  cookie = cookies.find((c) => c?.startsWith('session='))!.split(';')[0]
})

afterAll(async () => {
  await closeApp()
})

// ---------- helpers ----------

async function seedCategories() {
  const result = await app.pg.query(`
    INSERT INTO categories (name) VALUES ('Head'), ('Hands'), ('Heart')
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING *
  `)
  return result.rows
}

async function createTestActivity(overrides: Record<string, any> = {}) {
  const defaults = {
    title: 'Test activity',
    description: 'A test',
    suggested_duration: 15,
    min_stress_level: 1,
    max_stress_level: 5,
    source: 'base',
    user_id: null,
  }
  const data = { ...defaults, ...overrides }

  const result = await app.pg.query(
    `INSERT INTO activities (title, description, suggested_duration, min_stress_level, max_stress_level, source, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
    [data.title, data.description, data.suggested_duration, data.min_stress_level, data.max_stress_level, data.source, data.user_id]
  )
  return result.rows[0]
}

async function linkActivityToCategory(activityId: string, categoryId: number) {
  await app.pg.query(
    'INSERT INTO activity_categories (activity_id, category_id) VALUES ($1, $2)',
    [activityId, categoryId]
  )
}

/** Get the logged-in user's ID from the database */
async function getTestUserId(): Promise<string> {
  const result = await app.pg.query("SELECT id FROM users WHERE email = 'test@example.com'")
  return result.rows[0].id
}

// ---------- GET /activities ----------

describe('GET /activities', () => {
  it('returns an empty array when there are no activities', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/activities',
      headers: { cookie },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([])
  })

  it('returns all activities', async () => {
    await createTestActivity({ title: 'Walk' })
    await createTestActivity({ title: 'Read' })

    const response = await app.inject({
      method: 'GET',
      url: '/activities',
      headers: { cookie },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveLength(2)
  })

  it('filters by category — returns matching activities', async () => {
    const categories = await seedCategories()
    const headId = categories.find((c: any) => c.name === 'Head').id
    const handsId = categories.find((c: any) => c.name === 'Hands').id

    const puzzle = await createTestActivity({ title: 'Puzzle' })
    const walk = await createTestActivity({ title: 'Walk' })

    await linkActivityToCategory(puzzle.id, headId)
    await linkActivityToCategory(walk.id, handsId)

    const response = await app.inject({
      method: 'GET',
      url: '/activities?category=Head',
      headers: { cookie },
    })

    expect(response.statusCode).toBe(200)
    const activities = response.json()
    expect(activities).toHaveLength(1)
    expect(activities[0].title).toBe('Puzzle')
  })

  it('filters by category — returns empty when no match', async () => {
    const categories = await seedCategories()
    const headId = categories.find((c: any) => c.name === 'Head').id

    const puzzle = await createTestActivity({ title: 'Puzzle' })
    await linkActivityToCategory(puzzle.id, headId)

    const response = await app.inject({
      method: 'GET',
      url: '/activities?category=Heart',
      headers: { cookie },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([])
  })

  it('filters by stress level — returns matching activities', async () => {
    await createTestActivity({ title: 'Low stress only', min_stress_level: 1, max_stress_level: 2 })
    await createTestActivity({ title: 'Any stress', min_stress_level: 1, max_stress_level: 5 })

    const response = await app.inject({
      method: 'GET',
      url: '/activities?stress_level=4',
      headers: { cookie },
    })

    expect(response.statusCode).toBe(200)
    const activities = response.json()
    expect(activities).toHaveLength(1)
    expect(activities[0].title).toBe('Any stress')
  })

  it('filters by stress level — returns empty when no match', async () => {
    await createTestActivity({ title: 'Low stress only', min_stress_level: 1, max_stress_level: 2 })

    const response = await app.inject({
      method: 'GET',
      url: '/activities?stress_level=5',
      headers: { cookie },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([])
  })

  it('filters by both category and stress level — returns matching', async () => {
    const categories = await seedCategories()
    const headId = categories.find((c: any) => c.name === 'Head').id
    const handsId = categories.find((c: any) => c.name === 'Hands').id

    const lowHead = await createTestActivity({ title: 'Easy puzzle', min_stress_level: 1, max_stress_level: 2 })
    const highHead = await createTestActivity({ title: 'Hard puzzle', min_stress_level: 1, max_stress_level: 5 })
    const highHands = await createTestActivity({ title: 'Walk', min_stress_level: 1, max_stress_level: 5 })

    await linkActivityToCategory(lowHead.id, headId)
    await linkActivityToCategory(highHead.id, headId)
    await linkActivityToCategory(highHands.id, handsId)

    const response = await app.inject({
      method: 'GET',
      url: '/activities?category=Head&stress_level=4',
      headers: { cookie },
    })

    expect(response.statusCode).toBe(200)
    const activities = response.json()
    expect(activities).toHaveLength(1)
    expect(activities[0].title).toBe('Hard puzzle')
  })

  it('filters by both category and stress level — returns empty when no match', async () => {
    const categories = await seedCategories()
    const headId = categories.find((c: any) => c.name === 'Head').id

    const lowHead = await createTestActivity({ title: 'Easy puzzle', min_stress_level: 1, max_stress_level: 2 })
    await linkActivityToCategory(lowHead.id, headId)

    const response = await app.inject({
      method: 'GET',
      url: '/activities?category=Head&stress_level=5',
      headers: { cookie },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([])
  })
})

// ---------- GET /activities/:id ----------

describe('GET /activities/:id', () => {
  it('returns an activity by id', async () => {
    await createTestActivity()
    await createTestActivity()
    const activity = await createTestActivity({ title: 'Walk' })

    const response = await app.inject({
      method: 'GET',
      url: `/activities/${activity.id}`,
      headers: { cookie },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().title).toBe('Walk')
  })

  it('returns 404 for a non-existent UUID', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/activities/00000000-0000-0000-0000-000000000000',
      headers: { cookie },
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().error).toBe('Activity not found')
  })

  it('returns 400 for an invalid UUID', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/activities/not-a-uuid',
      headers: { cookie },
    })

    expect(response.statusCode).toBe(400)
  })
})

// ---------- POST /activities ----------

describe('POST /activities', () => {
  it('creates an activity and returns 201', async () => {
    const categories = await seedCategories()
    const headId = categories.find((c: any) => c.name === 'Head').id

    const response = await app.inject({
      method: 'POST',
      url: '/activities',
      headers: { cookie },
      payload: {
        title: 'Go for a walk',
        description: 'A nice walk outside',
        suggested_duration: 20,
        min_stress_level: 1,
        max_stress_level: 4,
        category_ids: [headId],
      },
    })

    expect(response.statusCode).toBe(201)
    const body = response.json()
    expect(body.title).toBe('Go for a walk')
    expect(body.source).toBe('user')
  })

  it('tags an activity as ai-sourced when source: "ai" is passed', async () => {
    const categories = await seedCategories()
    const headId = categories.find((c: any) => c.name === 'Head').id

    const response = await app.inject({
      method: 'POST',
      url: '/activities',
      headers: { cookie },
      payload: {
        title: 'Teken je koffiemok',
        suggested_duration: 10,
        min_stress_level: 1,
        max_stress_level: 4,
        category_ids: [headId],
        source: 'ai',
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json().source).toBe('ai')
  })

  it('rejects a source the user is not allowed to set (e.g. "base")', async () => {
    const categories = await seedCategories()
    const headId = categories.find((c: any) => c.name === 'Head').id

    const response = await app.inject({
      method: 'POST',
      url: '/activities',
      headers: { cookie },
      payload: {
        title: 'Sneaky base activity',
        suggested_duration: 10,
        min_stress_level: 1,
        max_stress_level: 4,
        category_ids: [headId],
        source: 'base',
      },
    })

    expect(response.statusCode).toBe(400)
  })

  it('saves category links in the junction table', async () => {
    const categories = await seedCategories()
    const headId = categories.find((c: any) => c.name === 'Head').id
    const handsId = categories.find((c: any) => c.name === 'Hands').id

    const response = await app.inject({
      method: 'POST',
      url: '/activities',
      headers: { cookie },
      payload: {
        title: 'Coloring book',
        description: 'Creative and relaxing',
        suggested_duration: 20,
        min_stress_level: 1,
        max_stress_level: 4,
        category_ids: [headId, handsId],
      },
    })

    const activity = response.json()

    const links = await app.pg.query(
      'SELECT category_id FROM activity_categories WHERE activity_id = $1 ORDER BY category_id',
      [activity.id]
    )

    expect(links.rows).toHaveLength(2)
    expect(links.rows.map((r: any) => r.category_id)).toEqual([headId, handsId])
  })

  it('returns 400 when required fields are missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/activities',
      headers: { cookie },
      payload: {
        title: 'Walk',
        // missing: suggested_duration, min/max_stress_level, category_ids
      },
    })

    expect(response.statusCode).toBe(400)
  })

  it('returns 400 when fields have wrong types', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/activities',
      headers: { cookie },
      payload: {
        title: 'Walk',
        suggested_duration: 'twenty',
        min_stress_level: 1,
        max_stress_level: 5,
        category_ids: [1],
      },
    })

    expect(response.statusCode).toBe(400)
  })
})

// ---------- PUT /activities/:id ----------

describe('PUT /activities/:id', () => {
  it('updates an activity', async () => {
    const userId = await getTestUserId()
    const activity = await createTestActivity({ title: 'Old title', source: 'user', user_id: userId })

    const response = await app.inject({
      method: 'PUT',
      url: `/activities/${activity.id}`,
      headers: { cookie },
      payload: {
        title: 'New title',
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().title).toBe('New title')
  })

  it('partial update preserves unchanged fields', async () => {
    const userId = await getTestUserId()
    const activity = await createTestActivity({
      title: 'Walk',
      description: 'A nice walk',
      suggested_duration: 20,
      source: 'user',
      user_id: userId,
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/activities/${activity.id}`,
      headers: { cookie },
      payload: {
        title: 'Long walk',
      },
    })

    const updated = response.json()
    expect(updated.title).toBe('Long walk')
    expect(updated.description).toBe('A nice walk')
    expect(updated.suggested_duration).toBe(20)
  })

  it('updates the right activity when multiple exist', async () => {
    const userId = await getTestUserId()
    const first = await createTestActivity({ title: 'First', source: 'user', user_id: userId })
    const second = await createTestActivity({ title: 'Second', source: 'user', user_id: userId })

    await app.inject({
      method: 'PUT',
      url: `/activities/${second.id}`,
      headers: { cookie },
      payload: { title: 'Updated second' },
    })

    // Verify first is untouched
    const checkFirst = await app.pg.query('SELECT title FROM activities WHERE id = $1', [first.id])
    expect(checkFirst.rows[0].title).toBe('First')
  })

  it('updates category links in the pivot table', async () => {
    const userId = await getTestUserId()
    const categories = await seedCategories()
    const headId = categories.find((c: any) => c.name === 'Head').id
    const handsId = categories.find((c: any) => c.name === 'Hands').id
    const heartId = categories.find((c: any) => c.name === 'Heart').id

    const activity = await createTestActivity({ title: 'Flexible activity', source: 'user', user_id: userId })
    await linkActivityToCategory(activity.id, headId)

    const response = await app.inject({
      method: 'PUT',
      url: `/activities/${activity.id}`,
      headers: { cookie },
      payload: {
        category_ids: [handsId, heartId],
      },
    })

    expect(response.statusCode).toBe(200)

    const links = await app.pg.query(
      'SELECT category_id FROM activity_categories WHERE activity_id = $1 ORDER BY category_id',
      [activity.id]
    )

    expect(links.rows).toHaveLength(2)
    const ids = links.rows.map((r: any) => r.category_id)
    expect(ids).toContain(handsId)
    expect(ids).toContain(heartId)
    expect(ids).not.toContain(headId)
  })

  it('returns 404 for a non-existent activity', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/activities/00000000-0000-0000-0000-000000000000',
      headers: { cookie },
      payload: { title: 'Ghost' },
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().error).toBe('Activity not found')
  })

  it('returns 400 for an invalid UUID', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/activities/not-a-uuid',
      headers: { cookie },
      payload: { title: 'Nope' },
    })

    expect(response.statusCode).toBe(400)
  })

  it('returns 400 when fields have wrong types', async () => {
    const userId = await getTestUserId()
    const activity = await createTestActivity({ source: 'user', user_id: userId })

    const response = await app.inject({
      method: 'PUT',
      url: `/activities/${activity.id}`,
      headers: { cookie },
      payload: {
        suggested_duration: 'twenty',
      },
    })

    expect(response.statusCode).toBe(400)
  })
})

// ---------- DELETE /activities/:id ----------

describe('DELETE /activities/:id', () => {
  it('deletes a user-owned activity', async () => {
    const userId = await getTestUserId()
    const activity = await createTestActivity({ title: 'To be deleted', source: 'user', user_id: userId })

    const response = await app.inject({
      method: 'DELETE',
      url: `/activities/${activity.id}`,
      headers: { cookie },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ ok: true, action: 'deleted' })

    // Verify it's actually gone
    const check = await app.pg.query('SELECT * FROM activities WHERE id = $1', [activity.id])
    expect(check.rows).toHaveLength(0)
  })

  it('returns 404 for a non-existent activity', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/activities/00000000-0000-0000-0000-000000000000',
      headers: { cookie },
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().error).toBe('Activity not found')
  })

  it('returns 400 for an invalid UUID', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/activities/not-a-uuid',
      headers: { cookie },
    })

    expect(response.statusCode).toBe(400)
  })
})
