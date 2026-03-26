  import Fastify from 'fastify'
  import cors from '@fastify/cors'
  import cookie from '@fastify/cookie'
  import dbPlugin from './db/index.js'
  import activityRoutes from './routes.js'
  import authRoutes from './routes/auth.js'

  export async function buildApp() {
    const fastify = Fastify({ logger: true })

    await fastify.register(cors, {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    })
    await fastify.register(cookie)
    await fastify.register(dbPlugin)
    await fastify.register(authRoutes)
    await fastify.register(activityRoutes)

    return fastify
  }