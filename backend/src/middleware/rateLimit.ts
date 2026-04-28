import type { FastifyRequest, FastifyReply } from 'fastify'

interface RateLimitOptions {
    endpoint: 'chat' | 'onboarding'
    maxRequests: number
    window: 'day' | 'total'
}

/**
 * Creates a Fastify preHandler that enforces per-user rate limits.
 *
 * - 'day' window: counts requests since midnight UTC today
 * - 'total' window: counts all-time requests for this endpoint
 *
 * On success, records the usage. Returns 429 if limit is exceeded.
 */
export function createRateLimiter(options: RateLimitOptions) {
    const { endpoint, maxRequests, window } = options

    return async function rateLimitHandler(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user!.id

        const timeCondition = window === 'day'
            ? 'AND created_at >= CURRENT_DATE'
            : ''

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
            reply.status(429).send({
                error: endpoint === 'chat'
                    ? 'Je hebt je limiet voor vandaag bereikt. Probeer het morgen weer.'
                    : 'Je hebt het maximaal aantal pogingen bereikt.',
            })
            return reply
        }
    }
}
