import Fastify from 'fastify'
import cors from '@fastify/cors'
import pool from './db/index.js'
import activityRoutes from './routes.js'

const fastify = Fastify({ logger: true })

await fastify.register(cors, {})

fastify.register(pool)
fastify.register(activityRoutes)

async function start() {
  try {
    await fastify.listen({ port: 3000 })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
