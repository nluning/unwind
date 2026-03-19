import type { FastifyInstance } from 'fastify'
import { hashPassword, verifyPassword, generateSessionToken, createSession, invalidateSession } from '../auth.js'
import { requireAuth } from '../middleware/auth.js'

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
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
        [email, passwordHash]
      )

      const user = result.rows[0]
      const token = generateSessionToken()
      await createSession(fastify.pg, user.id, token)

      reply
        .setCookie('session', token, cookieOptions(fastify))
        .status(201)
        .send({ id: user.id, email: user.email })
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
        'SELECT id, email, password_hash FROM users WHERE email = $1',
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

      const token = generateSessionToken()
      await createSession(fastify.pg, user.id, token)

      reply
        .setCookie('session', token, cookieOptions(fastify))
        .status(200)
        .send({ id: user.id, email: user.email })
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
