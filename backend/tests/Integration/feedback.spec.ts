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
  cookie = await registerUser('test@example.com')
})

afterAll(async () => {
  await closeApp()
})

// ---------- helpers ----------

async function registerUser(email: string): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/register',
    payload: { email, password: 'password123' },
  })
  const raw = response.headers['set-cookie']
  const cookies = Array.isArray(raw) ? raw : [raw]
  return cookies.find((header) => header?.startsWith('session='))!.split(';')[0]
}

async function createTestActivity(title = 'Test activity') {
  const result = await app.pg.query(
    `INSERT INTO activities (title, description, suggested_duration, min_stress_level, max_stress_level, source, user_id)
     VALUES ($1, 'A test', 15, 1, 5, 'base', NULL)
     RETURNING *`,
    [title]
  )
  return result.rows[0]
}

/** Log an event through the real endpoint and return its id. */
async function logEvent(
  activityId: string,
  action: 'suggested' | 'accepted' | 'skipped' = 'accepted',
  asCookie = cookie
): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/usage-events',
    headers: { cookie: asCookie },
    payload: { activity_id: activityId, action, mode: 'mode1' },
  })
  return response.json().id
}

async function backdate(eventId: string, interval: string) {
  await app.pg.query(
    `UPDATE usage_events SET created_at = now() - $1::interval WHERE id = $2`,
    [interval, eventId]
  )
}

function getPending(asCookie = cookie) {
  return app.inject({ method: 'GET', url: '/me/pending-feedback', headers: { cookie: asCookie } })
}

function patchEvent(eventId: string, payload: Record<string, unknown>, asCookie = cookie) {
  return app.inject({
    method: 'PATCH',
    url: `/usage-events/${eventId}`,
    headers: { cookie: asCookie },
    payload,
  })
}

function getStats(asCookie = cookie) {
  return app.inject({ method: 'GET', url: '/me/stats', headers: { cookie: asCookie } })
}

/** Log an accepted event and answer it. */
async function logAnswered(activityId: string, outcome: 'better' | 'same' | 'worse', asCookie = cookie) {
  const eventId = await logEvent(activityId, 'accepted', asCookie)
  await patchEvent(eventId, { outcome }, asCookie)
  return eventId
}

// ---------- POST /usage-events ----------

describe('POST /usage-events', () => {
  it('returns the id of the created event', async () => {
    const activity = await createTestActivity()

    const response = await app.inject({
      method: 'POST',
      url: '/usage-events',
      headers: { cookie },
      payload: { activity_id: activity.id, action: 'accepted', mode: 'mode1' },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json().ok).toBe(true)
    const stored = await app.pg.query('SELECT id FROM usage_events WHERE id = $1', [response.json().id])
    expect(stored.rows).toHaveLength(1)
  })

  describe('client-generated id (offline outbox)', () => {
    const clientId = '3f2b8c1e-5a47-4d0e-9b6a-1c2d3e4f5a6b'

    function postEvent(payload: Record<string, unknown>, asCookie = cookie) {
      return app.inject({ method: 'POST', url: '/usage-events', headers: { cookie: asCookie }, payload })
    }

    async function timesAccepted(activityId: string): Promise<number> {
      const result = await app.pg.query('SELECT times_accepted FROM activities WHERE id = $1', [activityId])
      return result.rows[0].times_accepted
    }

    it('stores the event under the id the client sent and echoes it back', async () => {
      const activity = await createTestActivity()

      const response = await postEvent({ id: clientId, activity_id: activity.id, action: 'accepted', mode: 'mode1' })

      expect(response.statusCode).toBe(201)
      expect(response.json().id).toBe(clientId)
      const stored = await app.pg.query('SELECT user_id FROM usage_events WHERE id = $1', [clientId])
      expect(stored.rows).toHaveLength(1)
    })

    it('treats a repeat of the same event as a success and counts it once', async () => {
      const activity = await createTestActivity()
      const payload = { id: clientId, activity_id: activity.id, action: 'accepted', mode: 'mode1' }

      const first = await postEvent(payload)
      const second = await postEvent(payload)

      expect(first.statusCode).toBe(201)
      expect(second.statusCode).toBe(201)
      expect(second.json().id).toBe(clientId)
      const stored = await app.pg.query('SELECT id FROM usage_events WHERE id = $1', [clientId])
      expect(stored.rows).toHaveLength(1)
      expect(await timesAccepted(activity.id)).toBe(1)
    })

    it("does not touch another user's event when the id collides, and reveals nothing", async () => {
      const activity = await createTestActivity()
      const otherCookie = await registerUser('other@example.com')
      await postEvent({ id: clientId, activity_id: activity.id, action: 'accepted', mode: 'mode1' }, otherCookie)

      const response = await postEvent({ id: clientId, activity_id: activity.id, action: 'skipped', mode: 'mode1' })

      expect(response.statusCode).toBe(201)
      const stored = await app.pg.query('SELECT action FROM usage_events WHERE id = $1', [clientId])
      expect(stored.rows).toHaveLength(1)
      expect(stored.rows[0].action).toBe('accepted')
      const skipped = await app.pg.query('SELECT times_skipped FROM activities WHERE id = $1', [activity.id])
      expect(skipped.rows[0].times_skipped).toBe(0)
    })

    it('rejects an id that is not a uuid', async () => {
      const activity = await createTestActivity()

      const response = await postEvent({ id: 'not-a-uuid', activity_id: activity.id, action: 'accepted', mode: 'mode1' })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('created_at (when it really happened)', () => {
    async function createdAtOf(eventId: string): Promise<Date> {
      const result = await app.pg.query('SELECT created_at FROM usage_events WHERE id = $1', [eventId])
      return result.rows[0].created_at
    }

    function postWithCreatedAt(activityId: string, createdAt: string) {
      return app.inject({
        method: 'POST',
        url: '/usage-events',
        headers: { cookie },
        payload: { activity_id: activityId, action: 'accepted', mode: 'mode1', created_at: createdAt },
      })
    }

    it('keeps a plausible timestamp from the client', async () => {
      const activity = await createTestActivity()
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)

      const response = await postWithCreatedAt(activity.id, twoHoursAgo.toISOString())

      const stored = await createdAtOf(response.json().id)
      expect(Math.abs(stored.getTime() - twoHoursAgo.getTime())).toBeLessThan(1000)
    })

    it('clamps a timestamp in the future to now', async () => {
      const activity = await createTestActivity()
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      const response = await postWithCreatedAt(activity.id, tomorrow.toISOString())

      const stored = await createdAtOf(response.json().id)
      expect(stored.getTime()).toBeLessThanOrEqual(Date.now())
    })

    it('clamps a timestamp from months ago to the backdate limit instead of rejecting it', async () => {
      const activity = await createTestActivity()
      const longAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

      const response = await postWithCreatedAt(activity.id, longAgo.toISOString())

      expect(response.statusCode).toBe(201)
      const stored = await createdAtOf(response.json().id)
      const ageInDays = (Date.now() - stored.getTime()) / (24 * 60 * 60 * 1000)
      expect(ageInDays).toBeGreaterThan(6.9)
      expect(ageInDays).toBeLessThan(7.1)
    })
  })
})

// ---------- GET /me/pending-feedback ----------

describe('GET /me/pending-feedback', () => {
  it('requires authentication', async () => {
    const response = await app.inject({ method: 'GET', url: '/me/pending-feedback' })

    expect(response.statusCode).toBe(401)
  })

  it('returns null when the user has no accepted events', async () => {
    const response = await getPending()

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ pending: null })
  })

  it('returns null while the accepted event is still too young', async () => {
    const activity = await createTestActivity()
    await logEvent(activity.id)

    const response = await getPending()

    expect(response.json()).toEqual({ pending: null })
  })

  it('returns the event once it is old enough', async () => {
    const activity = await createTestActivity('Go for a walk')
    const eventId = await logEvent(activity.id)
    await backdate(eventId, '15 minutes')

    const response = await getPending()

    expect(response.json()).toEqual({
      pending: {
        id: eventId,
        activity: { id: activity.id, title: 'Go for a walk', source: 'base' },
      },
    })
  })

  it('returns null once the event is older than 24 hours', async () => {
    const activity = await createTestActivity()
    const eventId = await logEvent(activity.id)
    await backdate(eventId, '25 hours')

    const response = await getPending()

    expect(response.json()).toEqual({ pending: null })
  })

  it('ignores suggested and skipped events', async () => {
    const activity = await createTestActivity()
    for (const action of ['suggested', 'skipped'] as const) {
      const eventId = await logEvent(activity.id, action)
      await backdate(eventId, '15 minutes')
    }

    const response = await getPending()

    expect(response.json()).toEqual({ pending: null })
  })

  it('returns null after the event has been answered', async () => {
    const activity = await createTestActivity()
    const eventId = await logEvent(activity.id)
    await backdate(eventId, '15 minutes')
    await patchEvent(eventId, { outcome: 'better' })

    const response = await getPending()

    expect(response.json()).toEqual({ pending: null })
  })

  it('returns null after the question has been dismissed', async () => {
    const activity = await createTestActivity()
    const eventId = await logEvent(activity.id)
    await backdate(eventId, '15 minutes')
    await patchEvent(eventId, { dismissed: true })

    const response = await getPending()

    expect(response.json()).toEqual({ pending: null })
  })

  it('only considers the latest accepted event', async () => {
    // Arrange — an older unanswered event, then a newer one that is still too young
    const activity = await createTestActivity()
    const olderId = await logEvent(activity.id)
    await backdate(olderId, '2 hours')
    await logEvent(activity.id)

    // Act
    const response = await getPending()

    // Assert — the older event expired silently, the newer one is not due yet
    expect(response.json()).toEqual({ pending: null })
  })

  it('does not return another user’s event', async () => {
    const activity = await createTestActivity()
    const eventId = await logEvent(activity.id)
    await backdate(eventId, '15 minutes')
    const otherCookie = await registerUser('other@example.com')

    const response = await getPending(otherCookie)

    expect(response.json()).toEqual({ pending: null })
  })
})

// ---------- PATCH /usage-events/:id ----------

describe('PATCH /usage-events/:id', () => {
  it('requires authentication', async () => {
    const activity = await createTestActivity()
    const eventId = await logEvent(activity.id)

    const response = await app.inject({
      method: 'PATCH',
      url: `/usage-events/${eventId}`,
      payload: { outcome: 'better' },
    })

    expect(response.statusCode).toBe(401)
  })

  it('stores the outcome and when it was given', async () => {
    const activity = await createTestActivity()
    const eventId = await logEvent(activity.id)

    const response = await patchEvent(eventId, { outcome: 'worse' })

    expect(response.statusCode).toBe(200)
    const stored = await app.pg.query(
      'SELECT outcome, outcome_at, feedback_dismissed_at FROM usage_events WHERE id = $1',
      [eventId]
    )
    expect(stored.rows[0].outcome).toBe('worse')
    expect(stored.rows[0].outcome_at).not.toBeNull()
    expect(stored.rows[0].feedback_dismissed_at).toBeNull()
  })

  it('records a dismissal without an outcome', async () => {
    const activity = await createTestActivity()
    const eventId = await logEvent(activity.id)

    const response = await patchEvent(eventId, { dismissed: true })

    expect(response.statusCode).toBe(200)
    const stored = await app.pg.query(
      'SELECT outcome, feedback_dismissed_at FROM usage_events WHERE id = $1',
      [eventId]
    )
    expect(stored.rows[0].outcome).toBeNull()
    expect(stored.rows[0].feedback_dismissed_at).not.toBeNull()
  })

  it('returns 404 when answering an event twice and keeps the first answer', async () => {
    const activity = await createTestActivity()
    const eventId = await logEvent(activity.id)
    await patchEvent(eventId, { outcome: 'better' })

    const response = await patchEvent(eventId, { outcome: 'worse' })

    expect(response.statusCode).toBe(404)
    const stored = await app.pg.query('SELECT outcome FROM usage_events WHERE id = $1', [eventId])
    expect(stored.rows[0].outcome).toBe('better')
  })

  it('returns 404 when dismissing an event that was already answered', async () => {
    const activity = await createTestActivity()
    const eventId = await logEvent(activity.id)
    await patchEvent(eventId, { outcome: 'same' })

    const response = await patchEvent(eventId, { dismissed: true })

    expect(response.statusCode).toBe(404)
  })

  it('returns 404 for another user’s event and leaves it untouched', async () => {
    const activity = await createTestActivity()
    const eventId = await logEvent(activity.id)
    const otherCookie = await registerUser('other@example.com')

    const response = await patchEvent(eventId, { outcome: 'better' }, otherCookie)

    expect(response.statusCode).toBe(404)
    const stored = await app.pg.query('SELECT outcome FROM usage_events WHERE id = $1', [eventId])
    expect(stored.rows[0].outcome).toBeNull()
  })

  it('returns 404 for events that are not accepted events', async () => {
    const activity = await createTestActivity()
    const eventId = await logEvent(activity.id, 'skipped')

    const response = await patchEvent(eventId, { outcome: 'better' })

    expect(response.statusCode).toBe(404)
  })

  it('returns 400 for an unknown outcome', async () => {
    const activity = await createTestActivity()
    const eventId = await logEvent(activity.id)

    const response = await patchEvent(eventId, { outcome: 'amazing' })

    expect(response.statusCode).toBe(400)
  })

  it('returns 400 for an empty body', async () => {
    const activity = await createTestActivity()
    const eventId = await logEvent(activity.id)

    const response = await patchEvent(eventId, {})

    expect(response.statusCode).toBe(400)
  })

  it('returns 400 when both outcome and dismissed are given', async () => {
    const activity = await createTestActivity()
    const eventId = await logEvent(activity.id)

    const response = await patchEvent(eventId, { outcome: 'better', dismissed: true })

    expect(response.statusCode).toBe(400)
  })
})

// ---------- GET /me/stats ----------

describe('GET /me/stats', () => {
  it('requires authentication', async () => {
    const response = await app.inject({ method: 'GET', url: '/me/stats' })

    expect(response.statusCode).toBe(401)
  })

  it('returns empty stats when nothing has been answered', async () => {
    const response = await getStats()

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ byActivity: [] })
  })

  it('counts outcomes per activity', async () => {
    const walk = await createTestActivity('Walk')
    await logAnswered(walk.id, 'better')
    await logAnswered(walk.id, 'better')
    await logAnswered(walk.id, 'worse')

    const response = await getStats()

    expect(response.json().byActivity).toEqual([
      { id: walk.id, title: 'Walk', source: 'base', better: 2, same: 0, worse: 1 },
    ])
  })

  it('keeps the counts of different activities separate', async () => {
    const walk = await createTestActivity('Walk')
    const read = await createTestActivity('Read')
    await logAnswered(walk.id, 'better')
    await logAnswered(read.id, 'worse')
    await logAnswered(read.id, 'same')

    const response = await getStats()

    expect(response.json().byActivity).toEqual([
      { id: read.id, title: 'Read', source: 'base', better: 0, same: 1, worse: 1 },
      { id: walk.id, title: 'Walk', source: 'base', better: 1, same: 0, worse: 0 },
    ])
  })

  it('ignores dismissed, unanswered and non-accepted events', async () => {
    const walk = await createTestActivity('Walk')
    const dismissedId = await logEvent(walk.id)
    await patchEvent(dismissedId, { dismissed: true })
    await logEvent(walk.id)
    await logEvent(walk.id, 'skipped')

    const response = await getStats()

    expect(response.json()).toEqual({ byActivity: [] })
  })

  it('only includes the session user’s own answers', async () => {
    const walk = await createTestActivity('Walk')
    await logAnswered(walk.id, 'better')
    const otherCookie = await registerUser('other@example.com')
    await logAnswered(walk.id, 'worse', otherCookie)

    const mine = await getStats()
    const theirs = await getStats(otherCookie)

    expect(mine.json().byActivity[0]).toMatchObject({ better: 1, worse: 0 })
    expect(theirs.json().byActivity[0]).toMatchObject({ better: 0, worse: 1 })
  })

  it('removes the answers when the account is deleted', async () => {
    const walk = await createTestActivity('Walk')
    const eventId = await logAnswered(walk.id, 'better')

    await app.inject({ method: 'DELETE', url: '/me', headers: { cookie } })

    const stored = await app.pg.query('SELECT id FROM usage_events WHERE id = $1', [eventId])
    expect(stored.rows).toHaveLength(0)
  })
})
