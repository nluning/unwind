import type { FastifyInstance } from 'fastify'
import Anthropic from '@anthropic-ai/sdk'
import { requireAuth } from '../middleware/auth.js'
import { createRateLimiter } from '../middleware/rateLimit.js'
import { getUserContext } from './buildSystemPrompt.js'
import {
    SUGGEST_FROM_LIST_SYSTEM_PROMPT,
    buildSuggestFromListUserMessage,
    parseSuggestionsResponse,
} from './suggestFromListPrompt.js'

const client = new Anthropic()

// Cap on how many of the user's own activities to feed the prompt. The most
// recent are the freshest register signal; 30 keeps the prompt bounded.
const ADDED_ACTIVITIES_LIMIT = 30

async function generateRoutes(fastify: FastifyInstance) {
    // Relaxed-moment, opt-in route — a low daily cap is plenty and keeps the
    // Sonnet cost predictable. Logged to api_usage like every other AI call.
    const suggestRateLimit = createRateLimiter({ endpoint: 'suggest_from_list', maxRequests: 10, window: 'day' })

    // Analyse-fit: AI riffs on the user's own list + picks to propose 3 NEW
    // activities. Returns ephemeral drafts — nothing is persisted here; the
    // client saves the ones the user picks via POST /activities.
    fastify.post(
        '/activities/suggest-from-list',
        { preHandler: [requireAuth, suggestRateLimit] },
        async (request, reply) => {
            const userId = request.user!.id

            const [userContext, addedResult] = await Promise.all([
                getUserContext(fastify.pg, userId),
                fastify.pg.query<{ title: string }>(
                    `SELECT title FROM activities
                     WHERE user_id = $1
                     ORDER BY created_at DESC
                     LIMIT $2`,
                    [userId, ADDED_ACTIVITIES_LIMIT]
                ),
            ])

            const userMessage = buildSuggestFromListUserMessage({
                addedActivities: addedResult.rows.map((row) => row.title),
                frequentlyAccepted: userContext.frequentlyAccepted,
                memories: userContext.memories,
            })

            const response = await client.messages.create({
                model: 'claude-sonnet-4-6',
                max_tokens: 1024,
                system: SUGGEST_FROM_LIST_SYSTEM_PROMPT,
                messages: [{ role: 'user', content: userMessage }],
            })

            const text = response.content
                .filter((block) => block.type === 'text')
                .map((block) => block.text)
                .join('')

            fastify.log.info(
                {
                    user_id: userId,
                    input_tokens: response.usage.input_tokens,
                    output_tokens: response.usage.output_tokens,
                },
                'suggest-from-list token usage'
            )

            const activities = parseSuggestionsResponse(text)
            if (!activities || activities.length === 0) {
                fastify.log.error({ raw: text.slice(0, 500) }, 'Failed to parse suggest-from-list response')
                reply.status(502).send({ error: 'Could not generate suggestions. Try again.' })
                return
            }

            reply.send({ activities })
        }
    )
}

export default generateRoutes
