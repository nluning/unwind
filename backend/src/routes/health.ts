import { FastifyInstance } from 'fastify'

async function healthRoutes(fastify: FastifyInstance) {
    fastify.get('/health', async function (_request, reply) {
        try {
            await fastify.pg.query('SELECT 1')
            return { status: 'ok', db: 'ok' }
        } catch (err) {
            fastify.log.error({ err }, 'Health check failed: db unreachable')
            return reply.code(503).send({ status: 'degraded', db: 'unreachable' })
        }
    })

    // TODO: remove after Sentry is verified working in production.
    fastify.get('/sentry-test', async function () {
        throw new Error('Sentry test from Unwind backend')
    })
}

export default healthRoutes
