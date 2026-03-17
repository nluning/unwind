import { FastifyInstance } from "fastify"

async function activityRoutes(fastify: FastifyInstance) {
    fastify.get('/health', function (request, reply) {
    reply.send({ status: 'ok' })
})
    fastify.get<{ Querystring: { category?: string; stress_level?: string } }>('/activities', async function (request, reply) {
        const { category, stress_level } = request.query

        const conditions: string[] = []
        const values: any[] = []

        if (category) {
            values.push(category)
            conditions.push(`c.name = $${values.length}`)
        }

        if (stress_level) {
            values.push(Number(stress_level))
            conditions.push(`a.min_stress_level <= $${values.length} AND a.max_stress_level >= $${values.length}`)
        }

        const where = conditions.length > 0
            ? 'WHERE ' + conditions.join(' AND ')
            : ''

        const result = await fastify.pg.query(
            `SELECT DISTINCT a.*
             FROM activities a
             LEFT JOIN activity_categories ac ON a.id = ac.activity_id
             LEFT JOIN categories c ON ac.category_id = c.id
             ${where}`,
            values
        )

        reply.send(result.rows)
    })

    // Fastify validation schemas (JSON Schema format)
    // ------------------------------------------------
    // These run BEFORE your route handler. If the request doesn't match,
    // Fastify auto-responds with 400 — your handler never executes.
    //
    // How it works:
    //   1. You define a schema object with `params`, `body`, or `querystring` keys
    //   2. You pass it as { schema: mySchema } in the route options (2nd argument)
    //   3. Fastify uses Ajv (a JSON Schema validator) to check the incoming request
    //
    // Key differences between POST and PUT schemas:
    //   - POST has `required: [...]` — you can't create without all fields
    //   - PUT has NO required fields — partial updates are allowed
    //
    // `as const` preserves literal types for better TypeScript inference.

    const idParamSchema = {
        params: {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid' }
            },
            required: ['id']
        }
    } as const

    fastify.get<{ Params: { id: string } }>('/activities/:id', { schema: idParamSchema }, async function (request, reply) {
        const { id } = request.params
        const result = await fastify.pg.query(
            'SELECT * FROM activities WHERE id = $1',
            [id]
        )
        if (result.rows.length === 0) {
            reply.status(404).send({ error: 'Activity not found' })
            return
        }
        reply.status(200).send(result.rows[0])
    })

    const postBodySchema = {
        body: {
            type: 'object',
            required: ['title', 'suggested_duration', 'min_stress_level', 'max_stress_level', 'category_ids'],
            properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                suggested_duration: { type: 'integer', minimum: 1 },
                min_stress_level: { type: 'integer', minimum: 1, maximum: 5 },
                max_stress_level: { type: 'integer', minimum: 1, maximum: 5 },
                category_ids: { type: 'array', items: { type: 'integer' }, minItems: 1 },
            },
        }
    } as const

    fastify.post<{ Body: { title: string; description?: string; suggested_duration: number; min_stress_level: number; max_stress_level: number; category_ids: number[] } }>
                ('/activities', { schema: postBodySchema }, async (request, reply) => {
                    const { title, description, suggested_duration, min_stress_level, max_stress_level, category_ids } = request.body

                    const result = await fastify.pg.query(
                        `INSERT INTO activities (title, description, suggested_duration, min_stress_level, max_stress_level, source)
                         VALUES ($1, $2, $3, $4, $5, 'user')
                         RETURNING *`,
                        [title, description ?? null, suggested_duration, min_stress_level, max_stress_level]
                    )

                    const activity = result.rows[0]

                    for (const categoryId of category_ids) {
                        await fastify.pg.query(
                            'INSERT INTO activity_categories (activity_id, category_id) VALUES ($1, $2)',
                            [activity.id, categoryId]
                        )
                    }

                    reply.status(201).send(activity)
                    })

    const putBodySchema = {
        ...idParamSchema,
        body: {
            type: 'object',
            properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                suggested_duration: { type: 'integer', minimum: 1 },
                min_stress_level: { type: 'integer', minimum: 1, maximum: 5 },
                max_stress_level: { type: 'integer', minimum: 1, maximum: 5 },
                category_ids: { type: 'array', items: { type: 'integer' }, minItems: 1 },
            },
        }
    } as const

    fastify.put<{ Params: { id: string }, Body: { title?: string; description?: string; suggested_duration?: number; min_stress_level?: number; max_stress_level?: number; category_ids?: number[] } }>
                ('/activities/:id', { schema: putBodySchema }, async function (request, reply) {
                    const { id } = request.params
                    const { title, description, suggested_duration, min_stress_level, max_stress_level, category_ids } = request.body

                    const result = await fastify.pg.query(
                        `UPDATE activities
                         SET title = COALESCE($1, title),
                             description = COALESCE($2, description),
                             suggested_duration = COALESCE($3, suggested_duration),
                             min_stress_level = COALESCE($4, min_stress_level),
                             max_stress_level = COALESCE($5, max_stress_level)
                         WHERE id = $6
                         RETURNING *`,
                        [title, description, suggested_duration, min_stress_level, max_stress_level, id]
                    )

                    if (result.rows.length === 0) {
                        reply.status(404).send({ error: 'Activity not found' })
                        return
                    }

                    if (category_ids) {
                        await fastify.pg.query('DELETE FROM activity_categories WHERE activity_id = $1', [id])
                        for (const categoryId of category_ids) {
                            await fastify.pg.query(
                                'INSERT INTO activity_categories (activity_id, category_id) VALUES ($1, $2)',
                                [id, categoryId]
                            )
                        }
                    }

                    reply.send(result.rows[0])
                }
            )
    fastify.delete<{Params: {id:string}}>('/activities/:id', { schema: idParamSchema }, async function (request, reply) {
        const { id } = request.params
        const result = await fastify.pg.query(
            'DELETE FROM activities WHERE id = $1 RETURNING *',
            [id]
        )
        if (result.rows.length === 0) {
            reply.status(404).send({ error: 'Activity could not be deleted' })
            return
        }
        reply.status(200).send(result.rows[0])
    })
};

export default activityRoutes