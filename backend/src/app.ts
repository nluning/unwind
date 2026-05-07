  import Fastify from 'fastify'
  import * as Sentry from '@sentry/node'
  import cors from '@fastify/cors'
  import cookie from '@fastify/cookie'
  import dbPlugin from './db/index.js'
  import activityRoutes from './routes/activities.js'
  import authRoutes from './routes/auth.js'
import chatRoutes from './routes/chat.js'
import healthRoutes from './routes/health.js'
import memoryRoutes from './routes/memory.js'
import onboardingRoutes from './routes/onboarding.js'
import { registerErrorHandler } from './errorHandler.js'

  export async function buildApp() {
    const fastify = Fastify({
      logger: {
        level: process.env.LOG_LEVEL || 'info',
        redact: ['req.headers.cookie', 'req.headers.authorization', '*.password'],
      },
      trustProxy: true,
    })

    registerErrorHandler(fastify)
    Sentry.setupFastifyErrorHandler(fastify)

    await fastify.register(cors, {
      origin: process.env.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    })
    await fastify.register(cookie)
    await fastify.register(dbPlugin)
    await fastify.register(healthRoutes)
    await fastify.register(authRoutes)
    await fastify.register(activityRoutes)
    await fastify.register(chatRoutes)
    await fastify.register(memoryRoutes)
    await fastify.register(onboardingRoutes)

    return fastify
  }