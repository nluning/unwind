import type { FastifyInstance, FastifyReply } from 'fastify'
import { hashPassword, verifyPassword, generateSessionToken, createSession, invalidateSession } from '../auth.js'
import { requireAuth } from '../middleware/auth.js'

async function sendAuthResponse(
  fastify: FastifyInstance,
  reply: FastifyReply,
  user: { id: string; email: string | null; onboarding_completed_at: Date | null },
  status: number
) {
  const token = generateSessionToken()
  await createSession(fastify.pg, user.id, token)

  reply
    .setCookie('session', token, cookieOptions(fastify))
    .status(status)
    .send({
      id: user.id,
      email: user.email,
      onboarding_completed_at: user.onboarding_completed_at,
    })
}

async function authRoutes(fastify: FastifyInstance) {

  // --- POST /register ---

  const registerSchema = {
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
      },
    },
  } as const

  fastify.post<{ Body: { email: string; password: string } }>(
    '/register',
    { schema: registerSchema },
    async (request, reply) => {
      const { email, password } = request.body

      const existing = await fastify.pg.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      )

      if (existing.rows.length > 0) {
        reply.status(409).send({ error: 'Email already registered' })
        return
      }

      const passwordHash = await hashPassword(password)

      const result = await fastify.pg.query(
        `INSERT INTO users (email, password_hash) VALUES ($1, $2)
         RETURNING id, email, onboarding_completed_at`,
        [email, passwordHash]
      )

      const user = result.rows[0]
      await sendAuthResponse(fastify, reply, user, 201)
    }
  )

  // --- POST /login ---

  const loginSchema = {
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string' },
        password: { type: 'string' },
      },
    },
  } as const

  fastify.post<{ Body: { email: string; password: string } }>(
    '/login',
    { schema: loginSchema },
    async (request, reply) => {
      const { email, password } = request.body

      const result = await fastify.pg.query(
        'SELECT id, email, password_hash, onboarding_completed_at FROM users WHERE email = $1',
        [email]
      )

      if (result.rows.length === 0) {
        reply.status(401).send({ error: 'Invalid email or password' })
        return
      }

      const user = result.rows[0]
      const validPassword = await verifyPassword(user.password_hash, password)

      if (!validPassword) {
        reply.status(401).send({ error: 'Invalid email or password' })
        return
      }

      await sendAuthResponse(fastify, reply, user, 200)
    }
  )

  // --- POST /logout ---

  fastify.post(
    '/logout',
    { preHandler: requireAuth },
    async (request, reply) => {
      const token = request.cookies.session!
      await invalidateSession(fastify.pg, token)

      reply
        .clearCookie('session', { path: '/' })
        .status(200)
        .send({ message: 'Logged out' })
    }
  )

  // --- GET /me ---

  fastify.get(
    '/me',
    { preHandler: requireAuth },
    async (request, reply) => {
      reply.send(request.user)
    }
  )

  // --- DELETE /me ---

  fastify.delete(
    '/me',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.user!.id

      await fastify.pg.query('DELETE FROM users WHERE id = $1', [userId])

      reply
        .clearCookie('session', { path: '/' })
        .status(204)
        .send()
    }
  )

  // --- POST /auth/device ---

  const deviceSchema = {
    body: {
      type: 'object',
      required: ['device_id'],
      properties: {
        device_id: { type: 'string', minLength: 1 },
      },
    },
  } as const

  fastify.post<{ Body: { device_id: string } }>(
    '/auth/device',
    { schema: deviceSchema },
    async (request, reply) => {
      const { device_id } = request.body

      // Check if this device already has a user
      const existing = await fastify.pg.query(
        'SELECT id, email, onboarding_completed_at FROM users WHERE device_id = $1',
        [device_id]
      )

      let user: { id: string; email: string | null; onboarding_completed_at: Date | null }

      if (existing.rows.length > 0) {
        user = existing.rows[0]
      } else {
        // Create an anonymous user (no email, no password)
        const result = await fastify.pg.query(
          `INSERT INTO users (device_id) VALUES ($1)
           RETURNING id, email, onboarding_completed_at`,
          [device_id]
        )
        user = result.rows[0]
      }

      await sendAuthResponse(fastify, reply, user, existing.rows.length > 0 ? 200 : 201)
    }
  )

  // --- POST /auth/upgrade ---

  const upgradeSchema = {
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
      },
    },
  } as const

  fastify.post<{ Body: { email: string; password: string } }>(
    '/auth/upgrade',
    { schema: upgradeSchema, preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.user!.id
      const passwordHash = await hashPassword(request.body.password)

      try {
        const result = await fastify.pg.query(
          'UPDATE users SET email = $1, password_hash = $2 WHERE id = $3 AND email IS NULL RETURNING id, email',
          [request.body.email, passwordHash, userId]
        )

        if (result.rows.length === 0) {
          reply.status(409).send({ error: 'Account already has an email' })
          return
        }

        reply.status(200).send(result.rows[0])
      } catch (err) {
        if ((err as { code?: string }).code === '23505') {
          reply.status(409).send({ error: 'Email already registered' })
          return
        }
        throw err
      }
    }
  )
}

// --- Cookie config ---

function cookieOptions(fastify: FastifyInstance) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  }
}

export default authRoutes
