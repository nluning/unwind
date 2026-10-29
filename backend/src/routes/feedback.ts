import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../middleware/auth.js'

// Don't ask "how did you feel afterwards?" until the user has had time to
// actually do the activity (a quick app-switch isn't "afterwards" yet), and stop
// asking once the moment has passed and they won't remember well enough.
export const FEEDBACK_MIN_AGE_MINUTES = 5
export const FEEDBACK_MAX_AGE_HOURS = 24

type Outcome = 'better' | 'same' | 'worse'

interface OutcomeCounts {
    better: number
    same: number
    worse: number
}

// Privacy: everything here is scoped to the session user. There is deliberately
// no admin or cross-user aggregate endpoint for outcomes, and outcomes must not
// be logged or sent to Sentry. See plan/28.
async function feedbackRoutes(fastify: FastifyInstance) {
    // --- GET /me/pending-feedback ---
    //
    // Only the user's latest accepted event is ever considered: if it is still
    // unanswered and old enough, ask about it. Older unanswered events expire
    // silently so questions never pile up.

    fastify.get(
        '/me/pending-feedback',
        { preHandler: requireAuth },
        async (request, reply) => {
            const userId = request.user!.id

            const result = await fastify.pg.query<{
                id: string
                activity_id: string
                title: string
                source: string
            }>(
                `SELECT latest.id, latest.activity_id, latest.title, latest.source
                 FROM (
                     SELECT ue.id, ue.activity_id, ue.created_at, ue.outcome, ue.feedback_dismissed_at,
                            a.title, a.source
                     FROM usage_events ue
                     JOIN activities a ON a.id = ue.activity_id
                     WHERE ue.user_id = $1 AND ue.action = 'accepted'
                     ORDER BY ue.created_at DESC
                     LIMIT 1
                 ) latest
                 WHERE latest.outcome IS NULL
                   AND latest.feedback_dismissed_at IS NULL
                   AND latest.created_at <= now() - make_interval(mins => $2::int)
                   AND latest.created_at >= now() - make_interval(hours => $3::int)`,
                [userId, FEEDBACK_MIN_AGE_MINUTES, FEEDBACK_MAX_AGE_HOURS]
            )

            const row = result.rows[0]
            if (!row) {
                reply.send({ pending: null })
                return
            }

            reply.send({
                pending: {
                    id: row.id,
                    activity: { id: row.activity_id, title: row.title, source: row.source },
                },
            })
        }
    )

    // --- PATCH /usage-events/:id ---
    //
    // Answer the question ({ outcome }) or skip it ({ dismissed: true }). Both are
    // one-shot: an event that already has an answer or a dismissal is 404, same
    // as someone else's event, so nothing can be overwritten or probed.

    const patchSchema = {
        params: {
            type: 'object',
            required: ['id'],
            properties: {
                id: { type: 'string', format: 'uuid' },
            },
        },
        body: {
            type: 'object',
            minProperties: 1,
            properties: {
                outcome: { type: 'string', enum: ['better', 'same', 'worse'] },
                dismissed: { type: 'boolean', enum: [true] },
            },
        },
    } as const

    fastify.patch<{ Params: { id: string }; Body: { outcome?: Outcome; dismissed?: true } }>(
        '/usage-events/:id',
        { schema: patchSchema, preHandler: requireAuth },
        async (request, reply) => {
            const userId = request.user!.id
            const { id } = request.params
            const { outcome, dismissed } = request.body

            if ((outcome === undefined) === (dismissed === undefined)) {
                reply.status(400).send({ error: 'Provide either outcome or dismissed.' })
                return
            }

            const result = outcome !== undefined
                ? await fastify.pg.query(
                    `UPDATE usage_events SET outcome = $1, outcome_at = now()
                     WHERE id = $2 AND user_id = $3 AND action = 'accepted'
                       AND outcome IS NULL AND feedback_dismissed_at IS NULL
                     RETURNING id`,
                    [outcome, id, userId]
                )
                : await fastify.pg.query(
                    `UPDATE usage_events SET feedback_dismissed_at = now()
                     WHERE id = $1 AND user_id = $2 AND action = 'accepted'
                       AND outcome IS NULL AND feedback_dismissed_at IS NULL
                     RETURNING id`,
                    [id, userId]
                )

            if (result.rows.length === 0) {
                reply.status(404).send({ error: 'Event not found' })
                return
            }

            reply.send({ ok: true })
        }
    )

    // --- GET /me/stats ---
    //
    // Counts of the user's own answers per activity. Skipped (dismissed) events
    // have no outcome and are therefore ignored. Ranking into "works well" /
    // "works less" is left to the client.

    fastify.get(
        '/me/stats',
        { preHandler: requireAuth },
        async (request, reply) => {
            const userId = request.user!.id

            const byActivity = await fastify.pg.query<{ id: string; title: string; source: string } & OutcomeCounts>(
                `SELECT a.id, a.title, a.source,
                        COUNT(*) FILTER (WHERE ue.outcome = 'better')::int AS better,
                        COUNT(*) FILTER (WHERE ue.outcome = 'same')::int   AS same,
                        COUNT(*) FILTER (WHERE ue.outcome = 'worse')::int  AS worse
                 FROM usage_events ue
                 JOIN activities a ON a.id = ue.activity_id
                 WHERE ue.user_id = $1 AND ue.outcome IS NOT NULL
                 GROUP BY a.id
                 ORDER BY a.title`,
                [userId]
            )

            reply.send({ byActivity: byActivity.rows })
        }
    )
}

export default feedbackRoutes
