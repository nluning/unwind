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
import {
    SUGGEST_FROM_ANSWERS_SYSTEM_PROMPT,
    buildSuggestFromAnswersUserMessage,
    parseSingleSuggestion,
    type QuickAnswers,
} from './suggestFromAnswersPrompt.js'

const client = new Anthropic()

// Cap on how many of the user's own activities to feed the prompt. The most
// recent are the freshest register signal; 30 keeps the prompt bounded.
const ADDED_ACTIVITIES_LIMIT = 30

async function generateRoutes(fastify: FastifyInstance) {

    const suggestRateLimit = createRateLimiter({ endpoint: 'suggest_from_list', maxRequests: 10, window: 'day' })


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

    const answersRateLimit = createRateLimiter({ endpoint: 'suggest_from_answers', maxRequests: 10, window: 'day' })

    const answersBodySchema = {
        body: {
            type: 'object',
            properties: {
                location: { type: 'string', enum: ['indoor', 'outdoor'] },
                social: { type: 'string', enum: ['alone', 'with_others'] },
                energy: { type: 'string', enum: ['calm', 'active'] },
                // Titles already shown this session ("Andere suggestie"): the
                // model gets the same answers + history every regenerate and
                // otherwise converges on the same activity, so it needs to be
                // told what to avoid.
                exclude: { type: 'array', items: { type: 'string', maxLength: 200 }, maxItems: 20 },
            },
            additionalProperties: false,
        },
    } as const

    fastify.post<{ Body: QuickAnswers & { exclude?: string[] } }>(
        '/activities/suggest-from-answers',
        { schema: answersBodySchema, preHandler: [requireAuth, answersRateLimit] },
        async (request, reply) => {
            const userId = request.user!.id
            const { exclude, ...answers } = request.body ?? {}

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

            const userMessage = buildSuggestFromAnswersUserMessage({
                answers,
                addedActivities: addedResult.rows.map((row) => row.title),
                frequentlyAccepted: userContext.frequentlyAccepted,
                memories: userContext.memories,
                exclude,
            })

            const response = await client.messages.create({
                model: 'claude-sonnet-4-6',
                max_tokens: 1024,
                // A little randomness so "Andere suggestie" varies even within
                // the same answers/history, on top of the exclude list.
                temperature: 1,
                system: SUGGEST_FROM_ANSWERS_SYSTEM_PROMPT,
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
                'suggest-from-answers token usage'
            )

            const activity = parseSingleSuggestion(text)
            if (!activity) {
                fastify.log.error({ raw: text.slice(0, 500) }, 'Failed to parse suggest-from-answers response')
                reply.status(502).send({ error: 'Could not generate a suggestion. Try again.' })
                return
            }

            reply.send({ activity })
        }
    )
}

export default generateRoutes
