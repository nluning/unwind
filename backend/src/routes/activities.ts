import { randomUUID } from 'node:crypto'
import { FastifyInstance } from "fastify"
import { requireAuth } from '../middleware/auth.js'

async function activityRoutes(fastify: FastifyInstance) {
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
            required: ['title', 'suggested_duration', 'min_stress_level', 'max_stress_level'],
            properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                suggested_duration: { type: 'integer', minimum: 1 },
                min_stress_level: { type: 'integer', minimum: 1, maximum: 5 },
                max_stress_level: { type: 'integer', minimum: 1, maximum: 5 },
                category_ids: { type: 'array', items: { type: 'integer' } },
                // Provenance. Defaults to 'user' (self-add); the AI routes pass
                // 'ai' when saving a generated suggestion. 'base' is reserved for
                // the seed library and not acceptable from a user request.
                source: { type: 'string', enum: ['user', 'ai'] },
            },
        }
    } as const

    fastify.post<{ Body: { title: string; description?: string; suggested_duration: number; min_stress_level: number; max_stress_level: number; category_ids?: number[]; source?: 'user' | 'ai' } }>
                ('/activities', { schema: postBodySchema, preHandler: requireAuth }, async (request, reply) => {
                    const { title, description, suggested_duration, min_stress_level, max_stress_level, category_ids, source } = request.body
                    const userId = request.user!.id

                    const result = await fastify.pg.query(
                        `INSERT INTO activities (title, description, suggested_duration, min_stress_level, max_stress_level, source, user_id)
                         VALUES ($1, $2, $3, $4, $5, $6, $7)
                         RETURNING *`,
                        [title, description ?? null, suggested_duration, min_stress_level, max_stress_level, source ?? 'user', userId]
                    )

                    const activity = result.rows[0]

                    for (const categoryId of category_ids ?? []) {
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
                category_ids: { type: 'array', items: { type: 'integer' } },
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

    // An event logged offline reaches the server hours later. created_at lets the
    // client say when it really happened, but a device clock can't be trusted, so
    // the server clamps it into [now - MAX_EVENT_BACKDATE_DAYS, now]. Clamp rather
    // than reject: a 4xx would make the client's outbox drop the event for good.
    const MAX_EVENT_BACKDATE_DAYS = 7

    const usageEventSchema = {
        body: {
            type: 'object',
            required: ['activity_id', 'action', 'mode'],
            properties: {
                // Client-generated so an event can be referenced (feedback PATCH)
                // and retried safely before the server has ever seen it.
                id: { type: 'string', format: 'uuid' },
                created_at: { type: 'string', format: 'date-time' },
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
            id?: string
            created_at?: string
            activity_id: string
            action: 'suggested' | 'accepted' | 'skipped'
            mode: 'mode1' | 'mode2' | 'mode3' | 'mode4'
            stress_level_before?: number
            stress_level_after?: number
        }
    }>('/usage-events', { schema: usageEventSchema, preHandler: requireAuth }, async function (request, reply) {
        const userId = request.user!.id
        const { created_at, activity_id, action, mode, stress_level_before, stress_level_after } = request.body
        // Old clients (and the online-only AI/chat callers) don't send an id.
        const eventId = request.body.id ?? randomUUID()

        const columnMap: Record<string, string> = {
            suggested: 'times_suggested',
            accepted: 'times_accepted',
            skipped: 'times_skipped',
        }
        const column = columnMap[action]

        // Idempotent: the client may send the same event more than once (an offline
        // outbox retries until it gets an answer). ON CONFLICT (id) DO NOTHING turns
        // a repeat into a no-op, and the counter bump is chained to the INSERT's
        // RETURNING, so it only happens when a row was actually inserted. One
        // statement = one atomic unit; no check-then-insert race between two tabs.
        // `column` comes from the fixed map above, never from user input.
        await fastify.pg.query(
            `WITH inserted AS (
                 INSERT INTO usage_events (id, user_id, activity_id, action, mode, stress_level_before, stress_level_after, created_at)
                 VALUES (
                     $1, $2, $3, $4, $5, $6, $7,
                     GREATEST(
                         LEAST(COALESCE($8::timestamptz, now()), now()),
                         now() - make_interval(days => $9::int)
                     )
                 )
                 ON CONFLICT (id) DO NOTHING
                 RETURNING id, activity_id
             )
             UPDATE activities SET ${column} = ${column} + 1
             WHERE id IN (SELECT activity_id FROM inserted)`,
            [eventId, userId, activity_id, action, mode, stress_level_before ?? null, stress_level_after ?? null, created_at ?? null, MAX_EVENT_BACKDATE_DAYS]
        )

        // The id is echoed back so the client can answer the post-activity feedback
        // question for this exact event ('klaar' button). Same answer for a fresh
        // insert and a duplicate: a repeat is a success, and an id that collides
        // with another user's event must not reveal that it exists.
        reply.status(201).send({ ok: true, id: eventId })
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
