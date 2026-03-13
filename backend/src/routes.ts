import { FastifyInstance } from "fastify"

async function activityRoutes(fastify: FastifyInstance) {
    fastify.get('/health', function (request, reply) {
    reply.send({ status: 'ok' })
})
    fastify.get('/activities', async function (request, reply) {
        const result = await fastify.pg.query('SELECT * FROM activities')
        reply.send(result.rows)
    })
};

export default activityRoutes