import { FastifyInstance } from "fastify"
import { requireAuth } from '../middleware/auth.js'

async function activityRoutes(fastify: FastifyInstance) {
    fastify.get('/health', function (request, reply) {
    reply.send({ status: 'ok' })
})
    fastify.get<{ Querystring: { category?: string; stress_level?: string } }>('/activities', { preHandler: requireAuth }, async function (request, reply) {
        const { category, stress_level } = request.query
        const userId = request.user!.id

        const conditions: string[] = []
        const values: any[] = []

        // Show the user's own activities + shared base activities
        values.push(userId)
        conditions.push(`(activity.user_id = $${values.length} OR activity.user_id IS NULL)`)

        // Exclude base activities this user has hidden (LEFT JOIN below
        // leaves hidden.* NULL for non-hidden rows).
        conditions.push(`hidden.activity_id IS NULL`)

        if (category) {
            values.push(category)
            conditions.push(`category.name = $${values.length}`)
        }

        if (stress_level) {
            values.push(Number(stress_level))
            conditions.push(`activity.min_stress_level <= $${values.length} AND activity.max_stress_level >= $${values.length}`)
        }

        const where = 'WHERE ' + conditions.join(' AND ')

        const result = await fastify.pg.query(
            `SELECT activity.*, COALESCE(array_agg(category.name) FILTER (WHERE category.name IS NOT NULL), '{}') AS categories
             FROM activities activity
             LEFT JOIN activity_categories activity_category ON activity.id = activity_category.activity_id
             LEFT JOIN categories category ON activity_category.category_id = category.id
             LEFT JOIN user_hidden_activities hidden ON hidden.activity_id = activity.id AND hidden.user_id = $1
             ${where}
             GROUP BY activity.id`,
            values
        )

        reply.send(result.rows)
    })

    const idParamSchema = {
        params: {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid' }
            },
            required: ['id']
        }
    } as const

    fastify.get<{ Params: { id: string } }>('/activities/:id', { schema: idParamSchema, preHandler: requireAuth }, async function (request, reply) {
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
                ('/activities', { schema: postBodySchema, preHandler: requireAuth }, async (request, reply) => {
                    const { title, description, suggested_duration, min_stress_level, max_stress_level, category_ids } = request.body
                    const userId = request.user!.id

                    const result = await fastify.pg.query(
                        `INSERT INTO activities (title, description, suggested_duration, min_stress_level, max_stress_level, source, user_id)
                         VALUES ($1, $2, $3, $4, $5, 'user', $6)
                         RETURNING *`,
                        [title, description ?? null, suggested_duration, min_stress_level, max_stress_level, userId]
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
                ('/activities/:id', { schema: putBodySchema, preHandler: requireAuth }, async function (request, reply) {
                    const { id } = request.params
                    const userId = request.user!.id
                    const { title, description, suggested_duration, min_stress_level, max_stress_level, category_ids } = request.body

                    const result = await fastify.pg.query(
                        `UPDATE activities
                         SET title = COALESCE($1, title),
                             description = COALESCE($2, description),
                             suggested_duration = COALESCE($3, suggested_duration),
                             min_stress_level = COALESCE($4, min_stress_level),
                             max_stress_level = COALESCE($5, max_stress_level)
                         WHERE id = $6 AND user_id = $7
                         RETURNING *`,
                        [title, description, suggested_duration, min_stress_level, max_stress_level, id, userId]
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
    // ── Usage events ──────────────────────────────────────────────

    const usageEventSchema = {
        body: {
            type: 'object',
            required: ['activity_id', 'action', 'mode'],
            properties: {
                activity_id: { type: 'string', format: 'uuid' },
                action: { type: 'string', enum: ['suggested', 'accepted', 'skipped'] },
                mode: { type: 'string', enum: ['mode1', 'mode2', 'mode3', 'mode4'] },
                stress_level_before: { type: 'integer', minimum: 1, maximum: 5 },
                stress_level_after: { type: 'integer', minimum: 1, maximum: 5 },
            },
        }
    } as const

    fastify.post<{
        Body: {
            activity_id: string
            action: 'suggested' | 'accepted' | 'skipped'
            mode: 'mode1' | 'mode2' | 'mode3' | 'mode4'
            stress_level_before?: number
            stress_level_after?: number
        }
    }>('/usage-events', { schema: usageEventSchema, preHandler: requireAuth }, async function (request, reply) {
        const userId = request.user!.id
        const { activity_id, action, mode, stress_level_before, stress_level_after } = request.body

        // Insert the event
        await fastify.pg.query(
            `INSERT INTO usage_events (user_id, activity_id, action, mode, stress_level_before, stress_level_after)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [userId, activity_id, action, mode, stress_level_before ?? null, stress_level_after ?? null]
        )

        // Update the counter on the activity
        const columnMap: Record<string, string> = {
            suggested: 'times_suggested',
            accepted: 'times_accepted',
            skipped: 'times_skipped',
        }
        const column = columnMap[action]
        await fastify.pg.query(
            `UPDATE activities SET ${column} = ${column} + 1 WHERE id = $1`,
            [activity_id]
        )

        reply.status(201).send({ ok: true })
    })

    fastify.delete<{ Params: { id: string } }>('/activities/:id', { schema: idParamSchema, preHandler: requireAuth }, async function (request, reply) {
        const { id } = request.params
        const userId = request.user!.id

        const lookup = await fastify.pg.query<{ user_id: string | null }>(
            'SELECT user_id FROM activities WHERE id = $1',
            [id]
        )

        if (lookup.rows.length === 0) {
            reply.status(404).send({ error: 'Activity not found' })
            return
        }

        const ownerId = lookup.rows[0]!.user_id

        // Base activity (shared, user_id IS NULL) → soft-hide for this user.
        if (ownerId === null) {
            await fastify.pg.query(
                `INSERT INTO user_hidden_activities (user_id, activity_id)
                 VALUES ($1, $2)
                 ON CONFLICT DO NOTHING`,
                [userId, id]
            )
            reply.status(200).send({ ok: true, action: 'hidden' })
            return
        }

        // Belongs to someone else — don't leak that it exists.
        if (ownerId !== userId) {
            reply.status(404).send({ error: 'Activity not found' })
            return
        }

        await fastify.pg.query('DELETE FROM activities WHERE id = $1', [id])
        reply.status(200).send({ ok: true, action: 'deleted' })
    })
};

export default activityRoutes
