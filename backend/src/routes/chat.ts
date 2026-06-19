import type { FastifyInstance } from 'fastify'
import Anthropic from '@anthropic-ai/sdk'
import * as Sentry from '@sentry/node'
import { requireAuth } from '../middleware/auth.js'
import { createRateLimiter } from '../middleware/rateLimit.js'
import { buildSystemPrompt, getUserContext, MAX_MESSAGES } from './buildSystemPrompt.js'

const client = new Anthropic()

interface ChatBody {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    stress_level?: number
    activity_context?: { title: string; description?: string }
}

async function chatRoutes(fastify: FastifyInstance) {
    const chatRateLimit = createRateLimiter({ endpoint: 'chat', maxRequests: 70, window: 'day' })

    const postBodySchema = {
        body: {
            type: 'object',
            required: ['messages'],
            properties: {
                messages: {
                    type: 'array',
                    items: {
                        type: 'object',
                        required: ['role', 'content'],
                        properties: {
                            role: { type: 'string', enum: ['user', 'assistant'] },
                            content: { type: 'string', maxLength: 5000 },
                        },
                    },
                    minItems: 1,
                    maxItems: MAX_MESSAGES,
                },
                stress_level: { type: 'integer', minimum: 1, maximum: 5 },
                activity_context: {
                    type: 'object',
                    required: ['title'],
                    properties: {
                        title: { type: 'string', maxLength: 200 },
                        description: { type: 'string', maxLength: 500 },
                    },
                    additionalProperties: false,
                },
            },
        },
    }

    fastify.post<{ Body: ChatBody }>(
        '/chat',
        { schema: postBodySchema, preHandler: [requireAuth, chatRateLimit] },
        async (request, reply) => {
            const { messages, stress_level, activity_context } = request.body
            const userContext = await getUserContext(fastify.pg, request.user!.id)

            const systemPrompt = buildSystemPrompt({
                messageCount: messages.length,
                stressLevel: stress_level,
                userContext,
                activityContext: activity_context,
            })

            const response = await client.messages.create({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 512,
                system: systemPrompt,
                messages,
            })

            const assistantText = response.content
                .filter((block) => block.type === 'text')
                .map((block) => block.text)
                .join('')

            fastify.log.info(
                {
                    user_id: request.user!.id,
                    input_tokens: response.usage.input_tokens,
                    output_tokens: response.usage.output_tokens,
                },
                'chat token usage'
            )

            reply.send({
                message: assistantText,
                usage: {
                    input_tokens: response.usage.input_tokens,
                    output_tokens: response.usage.output_tokens,
                },
            })
        }
    )

    // --- Streaming endpoint (SSE) ---

    fastify.post<{ Body: ChatBody }>(
        '/chat/stream',
        { schema: postBodySchema, preHandler: [requireAuth, chatRateLimit] },
        async (request, reply) => {
            const { messages, stress_level, activity_context } = request.body
            const userContext = await getUserContext(fastify.pg, request.user!.id)

            const systemPrompt = buildSystemPrompt({
                messageCount: messages.length,
                stressLevel: stress_level,
                userContext,
                activityContext: activity_context,
            })

            // Tell the client this is an SSE stream
            // CORS headers must be set manually here because reply.raw.writeHead()
            // bypasses Fastify's hook pipeline (where @fastify/cors adds headers)
            const origin = process.env.FRONTEND_URL ?? ''
            reply.raw.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Credentials': 'true',
            })

            try {
                const stream = client.messages.stream({
                    model: 'claude-haiku-4-5-20251001',
                    max_tokens: 512,
                    system: systemPrompt,
                    messages,
                })

                // If the client disconnects, stop generating (saves tokens/cost)
                request.raw.on('close', () => {
                    stream.abort()
                })

                stream.on('text', (text) => {
                    reply.raw.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`)
                })

                const finalMessage = await stream.finalMessage()

                // Send token usage as a separate event
                reply.raw.write(`data: ${JSON.stringify({
                    type: 'done',
                    usage: {
                        input_tokens: finalMessage.usage.input_tokens,
                        output_tokens: finalMessage.usage.output_tokens,
                    },
                })}\n\n`)

                fastify.log.info(
                    {
                        user_id: request.user!.id,
                        input_tokens: finalMessage.usage.input_tokens,
                        output_tokens: finalMessage.usage.output_tokens,
                    },
                    'chat stream token usage'
                )

                reply.raw.end()
            } catch (err: any) {
                // We've already called reply.raw.writeHead(200), so the route
                // resolves normally and neither the Fastify error handler nor
                // Sentry.setupFastifyErrorHandler sees the error — capture it
                // explicitly before writing the SSE error event. (Same pattern as
                // the parse-failure branches in generate.ts / onboarding.ts.)
                if (err?.status === 429) {
                    reply.raw.write(`data: ${JSON.stringify({ type: 'error', error: 'AI service is busy. Try again in a moment.' })}\n\n`)
                } else {
                    fastify.log.error(err, 'Claude API stream error')
                    Sentry.captureException(err)
                    reply.raw.write(`data: ${JSON.stringify({ type: 'error', error: 'AI service is temporarily unavailable.' })}\n\n`)
                }

                reply.raw.end()
            }
        }
    )
}

export default chatRoutes
