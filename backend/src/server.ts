import 'dotenv/config'
import { buildApp } from './app.js'

if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  console.error('URL cannot be found')
  process.exit(1)
}

const fastify = await buildApp()
fastify.log.level = 'info'

try {
  await fastify.listen({ port: 3000, host: '0.0.0.0' })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}