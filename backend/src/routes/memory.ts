import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../middleware/auth.js'

const MAX_MEMORIES_PER_USER = 30

async function memoryRoutes(fastify: FastifyInstance) {
    const idParamSchema = {
        params: {
            type: 'object',
            required: ['id'],
            properties: {
                id: { type: 'string', format: 'uuid' },
            },
        },
    } as const

    // --- GET /memories ---

    fastify.get(
        '/memories',
        { preHandler: requireAuth },
        async (request, reply) => {
            const userId = request.user!.id

            const result = await fastify.pg.query(
                'SELECT id, fact, source, created_at, updated_at FROM user_memories WHERE user_id = $1 ORDER BY created_at',
                [userId]
            )

            reply.send(result.rows)
        }
    )

    // --- POST /memories ---

    const postBodySchema = {
        body: {
            type: 'object',
            required: ['fact', 'source'],
            properties: {
                fact: { type: 'string', minLength: 1, maxLength: 500 },
                source: { type: 'string', enum: ['ai_learned', 'user_added', 'onboarding'] },
            },
        },
    } as const

    fastify.post<{ Body: { fact: string; source: 'ai_learned' | 'user_added' | 'onboarding' } }>(
        '/memories',
        { schema: postBodySchema, preHandler: requireAuth },
        async (request, reply) => {
            const userId = request.user!.id

            // Check if memory is enabled for this user
            const userResult = await fastify.pg.query(
                'SELECT memory_enabled FROM users WHERE id = $1',
                [userId]
            )

            if (!userResult.rows[0]?.memory_enabled) {
                reply.status(403).send({ error: 'Memory is not enabled for this account.' })
                return
            }

            // Check memory cap
            const countResult = await fastify.pg.query(
                'SELECT COUNT(*)::int AS count FROM user_memories WHERE user_id = $1',
                [userId]
            )

            if (countResult.rows[0].count >= MAX_MEMORIES_PER_USER) {
                reply.status(409).send({ error: 'Memory limit reached.' })
                return
            }

            const result = await fastify.pg.query(
                `INSERT INTO user_memories (user_id, fact, source)
                 VALUES ($1, $2, $3)
                 RETURNING id, fact, source, created_at, updated_at`,
                [userId, request.body.fact, request.body.source]
            )

            reply.status(201).send(result.rows[0])
        }
    )

    // --- POST /memories/batch ---

    const batchBodySchema = {
        body: {
            type: 'object',
            required: ['facts', 'source'],
            properties: {
                facts: {
                    type: 'array',
                    items: { type: 'string', minLength: 1, maxLength: 500 },
                    minItems: 1,
                    maxItems: MAX_MEMORIES_PER_USER,
                },
                source: { type: 'string', enum: ['ai_learned', 'user_added', 'onboarding'] },
            },
        },
    } as const

    fastify.post<{ Body: { facts: string[]; source: 'ai_learned' | 'user_added' | 'onboarding' } }>(
        '/memories/batch',
        { schema: batchBodySchema, preHandler: requireAuth },
        async (request, reply) => {
            const userId = request.user!.id
            const { facts, source } = request.body

            // Check if memory is enabled for this user
            const userResult = await fastify.pg.query(
                'SELECT memory_enabled FROM users WHERE id = $1',
                [userId]
            )

            if (!userResult.rows[0]?.memory_enabled) {
                reply.status(403).send({ error: 'Memory is not enabled for this account.' })
                return
            }

            // Check memory cap
            const countResult = await fastify.pg.query(
                'SELECT COUNT(*)::int AS count FROM user_memories WHERE user_id = $1',
                [userId]
            )

            const remaining = MAX_MEMORIES_PER_USER - countResult.rows[0].count
            if (remaining <= 0) {
                reply.status(409).send({ error: 'Memory limit reached.' })
                return
            }

            // Truncate to what fits within the cap
            const toInsert = facts.slice(0, remaining)

            // Insert all in a single transaction
            const client = await fastify.pg.connect()
            try {
                await client.query('BEGIN')

                const inserted = []
                for (const fact of toInsert) {
                    const result = await client.query(
                        `INSERT INTO user_memories (user_id, fact, source)
                         VALUES ($1, $2, $3)
                         RETURNING id, fact, source, created_at, updated_at`,
                        [userId, fact, source]
                    )
                    inserted.push(result.rows[0])
                }

                await client.query('COMMIT')
                reply.status(201).send(inserted)
            } catch (err) {
                await client.query('ROLLBACK')
                throw err
            } finally {
                client.release()
            }
        }
    )

    // --- PUT /memories/:id ---

    const putBodySchema = {
        ...idParamSchema,
        body: {
            type: 'object',
            required: ['fact'],
            properties: {
                fact: { type: 'string', minLength: 1, maxLength: 500 },
            },
        },
    } as const

    fastify.put<{ Params: { id: string }; Body: { fact: string } }>(
        '/memories/:id',
        { schema: putBodySchema, preHandler: requireAuth },
        async (request, reply) => {
            const userId = request.user!.id
            const { id } = request.params

            const result = await fastify.pg.query(
                `UPDATE user_memories
                 SET fact = $1, updated_at = now()
                 WHERE id = $2 AND user_id = $3
                 RETURNING id, fact, source, created_at, updated_at`,
                [request.body.fact, id, userId]
            )

            if (result.rows.length === 0) {
                reply.status(404).send({ error: 'Memory not found.' })
                return
            }

            reply.send(result.rows[0])
        }
    )

    // --- DELETE /memories/:id ---

    fastify.delete<{ Params: { id: string } }>(
        '/memories/:id',
        { schema: idParamSchema, preHandler: requireAuth },
        async (request, reply) => {
            const userId = request.user!.id
            const { id } = request.params

            const result = await fastify.pg.query(
                'DELETE FROM user_memories WHERE id = $1 AND user_id = $2 RETURNING id',
                [id, userId]
            )

            if (result.rows.length === 0) {
                reply.status(404).send({ error: 'Memory not found.' })
                return
            }

            reply.send({ ok: true })
        }
    )
}

export default memoryRoutes
