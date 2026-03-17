import { buildApp } from './app.js'

const fastify = await buildApp()
fastify.log.level = 'info'

try {
  await fastify.listen({ port: 3000 })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}