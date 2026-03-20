import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import type { FastifyInstance, LightMyRequestResponse } from 'fastify'
import { getApp, truncateAll, closeApp } from './setup.js'

let app: FastifyInstance

beforeAll(async () => {
  app = await getApp()
})

beforeEach(async () => {
  await truncateAll(app)
})

afterAll(async () => {
  await closeApp()
})

// ---------- helpers ----------

/** Extract the session cookie string from a Set-Cookie header */
function extractSessionCookie(response: LightMyRequestResponse): string {
  const raw = response.headers['set-cookie']
  // set-cookie can be a string or an array of strings
  const cookies = Array.isArray(raw) ? raw : [raw]
  const sessionCookie = cookies.find((c) => c?.startsWith('session='))
  if (!sessionCookie) throw new Error('No session cookie in response')
  // Return just "session=<value>" — strip the flags (httpOnly, path, etc.)
  return sessionCookie.split(';')[0]
}

/** Register a test user and return the response */
async function registerUser(overrides: { email?: string; password?: string } = {}) {
  return app.inject({
    method: 'POST',
    url: '/register',
    payload: {
      email: overrides.email ?? 'test@example.com',
      password: overrides.password ?? 'password123',
    },
  })
}

/** Register + extract cookie in one step (for tests that need a logged-in user) */
async function registerAndGetCookie(overrides: { email?: string; password?: string } = {}) {
  const response = await registerUser(overrides)
  return extractSessionCookie(response)
}

// ---------- POST /register ----------

describe('POST /register', () => {
  it('registers a new user and returns 201 with a session cookie', async () => {
    const response = await registerUser()

    expect(response.statusCode).toBe(201)

    const body = response.json()
    expect(body.email).toBe('test@example.com')
    expect(body.id).toBeDefined()
    // Password hash should never be returned
    expect(body.password_hash).toBeUndefined()

    // Should set an httpOnly session cookie
    const cookieHeader = response.headers['set-cookie']
    expect(cookieHeader).toBeDefined()
    expect(String(cookieHeader)).toContain('session=')
    expect(String(cookieHeader)).toContain('HttpOnly')
  })

  it('returns 409 when email already exists', async () => {
    await registerUser()
    const response = await registerUser() // same email again

    expect(response.statusCode).toBe(409)
    expect(response.json().error).toBe('Email already registered')
  })

  it('returns 400 when email is missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/register',
      payload: { password: 'password123' },
    })

    expect(response.statusCode).toBe(400)
  })

  it('returns 400 when password is too short', async () => {
    const response = await registerUser({ password: 'short' })

    expect(response.statusCode).toBe(400)
  })
})

// ---------- POST /login ----------

describe('POST /login', () => {
  it('logs in with correct credentials and sets a cookie', async () => {
    await registerUser()

    const response = await app.inject({
      method: 'POST',
      url: '/login',
      payload: { email: 'test@example.com', password: 'password123' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().email).toBe('test@example.com')
    expect(String(response.headers['set-cookie'])).toContain('session=')
  })

  it('returns 401 with wrong password', async () => {
    await registerUser()

    const response = await app.inject({
      method: 'POST',
      url: '/login',
      payload: { email: 'test@example.com', password: 'wrongpassword' },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().error).toBe('Invalid email or password')
  })

  it('returns 401 with non-existent email', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/login',
      payload: { email: 'nobody@example.com', password: 'password123' },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().error).toBe('Invalid email or password')
  })

  it('returns the same error for wrong email and wrong password', async () => {
    await registerUser()

    const wrongEmail = await app.inject({
      method: 'POST',
      url: '/login',
      payload: { email: 'nobody@example.com', password: 'password123' },
    })

    const wrongPassword = await app.inject({
      method: 'POST',
      url: '/login',
      payload: { email: 'test@example.com', password: 'wrongpassword' },
    })

    // Both should give the exact same error — prevents user enumeration
    expect(wrongEmail.json().error).toBe(wrongPassword.json().error)
  })
})

// ---------- GET /me ----------

describe('GET /me', () => {
  it('returns user info with a valid session', async () => {
    const cookie = await registerAndGetCookie()

    const response = await app.inject({
      method: 'GET',
      url: '/me',
      headers: { cookie },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().email).toBe('test@example.com')
  })

  it('returns 401 without a cookie', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/me',
    })

    expect(response.statusCode).toBe(401)
  })

  it('returns 401 with an invalid session token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/me',
      headers: { cookie: 'session=totally-fake-token' },
    })

    expect(response.statusCode).toBe(401)
  })
})

// ---------- POST /logout ----------

describe('POST /logout', () => {
  it('invalidates the session — GET /me returns 401 after logout', async () => {
    const cookie = await registerAndGetCookie()

    // Logout
    const logoutResponse = await app.inject({
      method: 'POST',
      url: '/logout',
      headers: { cookie },
    })

    expect(logoutResponse.statusCode).toBe(200)

    // The same cookie should no longer work
    const meResponse = await app.inject({
      method: 'GET',
      url: '/me',
      headers: { cookie },
    })

    expect(meResponse.statusCode).toBe(401)
  })
})

// ---------- POST /auth/device ----------

describe('POST /auth/device', () => {
  it('creates a new anonymous user and returns 201 with a cookie', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/device',
      payload: { device_id: 'device-abc-123' },
    })

    expect(response.statusCode).toBe(201)
    const body = response.json()
    expect(body.id).toBeDefined()
    expect(body.email).toBeNull()
    expect(String(response.headers['set-cookie'])).toContain('session=')
  })

  it('returns the same user on repeated calls with the same device_id', async () => {
    const first = await app.inject({
      method: 'POST',
      url: '/auth/device',
      payload: { device_id: 'device-abc-123' },
    })

    const second = await app.inject({
      method: 'POST',
      url: '/auth/device',
      payload: { device_id: 'device-abc-123' },
    })

    expect(first.statusCode).toBe(201)
    expect(second.statusCode).toBe(200)
    expect(first.json().id).toBe(second.json().id)
  })

  it('creates different users for different device_ids', async () => {
    const first = await app.inject({
      method: 'POST',
      url: '/auth/device',
      payload: { device_id: 'device-aaa' },
    })

    const second = await app.inject({
      method: 'POST',
      url: '/auth/device',
      payload: { device_id: 'device-bbb' },
    })

    expect(first.json().id).not.toBe(second.json().id)
  })

  it('returns 400 when device_id is missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/device',
      payload: {},
    })

    expect(response.statusCode).toBe(400)
  })
})

// ---------- POST /auth/upgrade ----------

describe('POST /auth/upgrade', () => {
  /** Helper: create an anonymous user via device auth and return the cookie */
  async function deviceLoginAndGetCookie(deviceId = 'device-abc-123') {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/device',
      payload: { device_id: deviceId },
    })
    const raw = response.headers['set-cookie']
    const cookies = Array.isArray(raw) ? raw : [raw]
    return cookies.find((c) => c?.startsWith('session='))!.split(';')[0]
  }

  it('upgrades an anonymous user with email and password', async () => {
    const cookie = await deviceLoginAndGetCookie()

    const response = await app.inject({
      method: 'POST',
      url: '/auth/upgrade',
      headers: { cookie },
      payload: { email: 'upgraded@example.com', password: 'password123' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().email).toBe('upgraded@example.com')
  })

  it('preserves the same user id after upgrade', async () => {
    const cookie = await deviceLoginAndGetCookie()

    // Get the anonymous user's id
    const meBeforeResponse = await app.inject({
      method: 'GET',
      url: '/me',
      headers: { cookie },
    })
    const idBefore = meBeforeResponse.json().id

    await app.inject({
      method: 'POST',
      url: '/auth/upgrade',
      headers: { cookie },
      payload: { email: 'upgraded@example.com', password: 'password123' },
    })

    // Check it's the same user
    const meAfterResponse = await app.inject({
      method: 'GET',
      url: '/me',
      headers: { cookie },
    })
    expect(meAfterResponse.json().id).toBe(idBefore)
    expect(meAfterResponse.json().email).toBe('upgraded@example.com')
  })

  it('upgraded user can log in with email and password', async () => {
    const cookie = await deviceLoginAndGetCookie()

    await app.inject({
      method: 'POST',
      url: '/auth/upgrade',
      headers: { cookie },
      payload: { email: 'upgraded@example.com', password: 'password123' },
    })

    // Now log in with email/password
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/login',
      payload: { email: 'upgraded@example.com', password: 'password123' },
    })

    expect(loginResponse.statusCode).toBe(200)
    expect(loginResponse.json().email).toBe('upgraded@example.com')
  })

  it('returns 409 when user already has an email', async () => {
    // Register a normal user (already has email)
    const cookie = await registerAndGetCookie()

    const response = await app.inject({
      method: 'POST',
      url: '/auth/upgrade',
      headers: { cookie },
      payload: { email: 'another@example.com', password: 'password123' },
    })

    expect(response.statusCode).toBe(409)
    expect(response.json().error).toBe('Account already has an email')
  })

  it('returns 409 when email is taken by another user', async () => {
    // Register a normal user with this email
    await registerUser({ email: 'taken@example.com' })

    // Create an anonymous user
    const cookie = await deviceLoginAndGetCookie()

    const response = await app.inject({
      method: 'POST',
      url: '/auth/upgrade',
      headers: { cookie },
      payload: { email: 'taken@example.com', password: 'password123' },
    })

    expect(response.statusCode).toBe(409)
    expect(response.json().error).toBe('Email already registered')
  })

  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/upgrade',
      payload: { email: 'test@example.com', password: 'password123' },
    })

    expect(response.statusCode).toBe(401)
  })
})

// ---------- Protected routes ----------

describe('Protected activity routes', () => {
  it('GET /activities returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/activities',
    })

    expect(response.statusCode).toBe(401)
  })

  it('GET /activities returns 200 with auth', async () => {
    const cookie = await registerAndGetCookie()

    const response = await app.inject({
      method: 'GET',
      url: '/activities',
      headers: { cookie },
    })

    expect(response.statusCode).toBe(200)
  })
})
