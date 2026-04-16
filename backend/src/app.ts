  import Fastify from 'fastify'
  import cors from '@fastify/cors'
  import cookie from '@fastify/cookie'
  import dbPlugin from './db/index.js'
  import activityRoutes from './routes.js'
  import authRoutes from './routes/auth.js'
import chatRoutes from './routes/chat.js'
import memoryRoutes from './routes/memory.js'
import onboardingRoutes from './routes/onboarding.js'

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
    await fastify.register(chatRoutes)
    await fastify.register(memoryRoutes)
    await fastify.register(onboardingRoutes)

    return fastify
  }