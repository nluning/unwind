import type { FastifyRequest, FastifyReply } from 'fastify'

interface RateLimitOptions {
    endpoint: 'chat' | 'onboarding' | 'suggest_from_list' | 'suggest_from_answers'
    maxRequests: number
    window: 'day' | 'week' | 'total'
}

/**
 * Creates a Fastify preHandler that enforces per-user rate limits.
 *
 * - 'day' window: counts requests since midnight UTC today
 * - 'week' window: counts requests in the last rolling 7 days
 * - 'total' window: counts all-time requests for this endpoint
 *
 * On success, records the usage. Returns 429 if limit is exceeded.
 */
export function createRateLimiter(options: RateLimitOptions) {
    const { endpoint, maxRequests, window } = options

    const timeCondition =
        window === 'day' ? 'AND created_at >= CURRENT_DATE'
        : window === 'week' ? "AND created_at >= now() - interval '7 days'"
        : ''

    return async function rateLimitHandler(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user!.id

        const result = await request.server.pg.query(
            `INSERT INTO api_usage (user_id, endpoint)
             SELECT $1, $2
             WHERE (
               SELECT COUNT(*) FROM api_usage
               WHERE user_id = $1 AND endpoint = $2 ${timeCondition}
             ) < $3`,
            [userId, endpoint, maxRequests]
        )

        if (result.rowCount === 0) {
            // Message keyed on the window, not the endpoint, so every limiter
            // gives an accurate "try again when" regardless of which route it guards.
            const limitMessage =
                window === 'day' ? 'Je hebt je limiet voor vandaag bereikt. Probeer het morgen weer.'
                : window === 'week' ? 'Je hebt je limiet voor deze week bereikt. Probeer het over een paar dagen weer.'
                : 'Je hebt je limiet bereikt.'

            reply.status(429).send({ error: limitMessage })
            return reply
        }
    }
}
