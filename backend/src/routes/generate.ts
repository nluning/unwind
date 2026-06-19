import type { FastifyInstance } from 'fastify'
import Anthropic from '@anthropic-ai/sdk'
import * as Sentry from '@sentry/node'
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

const ADDED_ACTIVITIES_LIMIT = 30

async function generateRoutes(fastify: FastifyInstance) {

    const suggestRateLimit = createRateLimiter({ endpoint: 'suggest_from_list', maxRequests: 10, window: 'day' })

    const suggestFromListBodySchema = {
        body: {
            type: ['object', 'null'],
            properties: {
                seed_activity_id: { type: 'string', format: 'uuid' },
            },
            additionalProperties: false,
        },
    } as const

    fastify.post<{ Body: { seed_activity_id?: string } }>(
        '/activities/suggest-from-list',
        { schema: suggestFromListBodySchema, preHandler: [requireAuth, suggestRateLimit] },
        async (request, reply) => {
            const userId = request.user!.id
            const seedActivityId = request.body?.seed_activity_id

            const [userContext, addedResult, seedResult] = await Promise.all([
                getUserContext(fastify.pg, userId),
                fastify.pg.query<{ title: string }>(
                    `SELECT title FROM activities
                     WHERE user_id = $1
                     ORDER BY created_at DESC
                     LIMIT $2`,
                    [userId, ADDED_ACTIVITIES_LIMIT]
                ),
                seedActivityId
                    ? fastify.pg.query<{ title: string; description: string | null; user_id: string | null }>(
                          `SELECT title, description, user_id FROM activities WHERE id = $1`,
                          [seedActivityId]
                      )
                    : Promise.resolve({ rows: [] as { title: string; description: string | null; user_id: string | null }[] }),
            ])

            const seedRow = seedResult.rows[0]
            const seed =
                seedRow && (seedRow.user_id === userId || seedRow.user_id === null)
                    ? { title: seedRow.title, description: seedRow.description }
                    : undefined

            const userMessage = buildSuggestFromListUserMessage({
                addedActivities: addedResult.rows.map((row) => row.title),
                frequentlyAccepted: userContext.frequentlyAccepted,
                memories: userContext.memories,
                doneToday: userContext.doneToday,
                seed,
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
                Sentry.captureMessage('Failed to parse suggest-from-list response', {
                    level: 'error',
                    tags: { endpoint: 'suggest-from-list' },
                    extra: { raw: text.slice(0, 500) },
                })
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
                doneToday: userContext.doneToday,
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
                Sentry.captureMessage('Failed to parse suggest-from-answers response', {
                    level: 'error',
                    tags: { endpoint: 'suggest-from-answers' },
                    extra: { raw: text.slice(0, 500) },
                })
                reply.status(502).send({ error: 'Could not generate a suggestion. Try again.' })
                return
            }

            reply.send({ activity })
        }
    )
}

export default generateRoutes
