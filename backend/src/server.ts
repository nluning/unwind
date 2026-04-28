import 'dotenv/config'
import { buildApp } from './app.js'
import { validateEnv } from './config.js'

validateEnv()

const fastify = await buildApp()
fastify.log.level = 'info'

try {
  await fastify.listen({ port: 3000, host: '0.0.0.0' })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}