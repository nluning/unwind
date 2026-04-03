import type { FastifyInstance } from 'fastify'
import Anthropic from '@anthropic-ai/sdk'
import { requireAuth } from '../middleware/auth.js'

const client = new Anthropic()

async function chatRoutes(fastify: FastifyInstance) {
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
                            content: { type: 'string' },
                        },
                    },
                    minItems: 1,
                    maxItems: 8,
                },
            },
        },
    }

    fastify.post<{ Body: { messages: Array<{ role: 'user' | 'assistant'; content: string }> } }>(
        '/chat',
        { schema: postBodySchema, preHandler: requireAuth },
        async (request, reply) => {
            const { messages } = request.body

            try {
                const response = await client.messages.create({
                    model: 'claude-haiku-4-5-20251001',
                    max_tokens: 512,
                    system: 'You are a helpful assistant.', // TODO: real system prompt (Chunk 2)
                    messages,
                })

                // Extract text from the response content blocks
                const assistantText = response.content
                    .filter((block) => block.type === 'text')
                    .map((block) => block.text)
                    .join('')

                // Log token usage for cost visibility
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
            } catch (err: any) {
                if (err?.status === 429) {
                    reply.status(429).send({ error: 'AI service is busy. Try again in a moment.' })
                    return
                }

                fastify.log.error(err, 'Claude API error')
                reply.status(503).send({ error: 'AI service is temporarily unavailable.' })
            }
        }
    )
}

export default chatRoutes
