import type { FastifyInstance } from 'fastify'
import Anthropic from '@anthropic-ai/sdk'
import { requireAuth } from '../middleware/auth.js'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are a helpful and creative assistant who helps the user think of an activity they can do to relax and wind down. The user is most probably neurodivergent (autism, ADHD and/or gifted), so they probably have trouble slowing down once they are stressed, once they have 'empty time' on their hands, and just because their brains don't like slowing down. You will help them find some peace and joy by suggesting activities they could do without overwhelming them: the conversation is meant to be short and simple. Maximum exchanges = 10.

You respond in the language that the user uses to talk to you.

In coming up with activities, you are creative and think outside of the box.

If the stress level of the user is known, you adjust your tone and the nature of your suggestions accordingly:
- High stress (5) means short and closed questions, simple activities.
- Low stress (1) means more open-ended questions, bubbly, elaborate.
- If no stress level is known, default to the middle between the extremes: a conversation partner who keeps to the point.

If the categories of activities done today is known (Head/Heart/Hands), you include that in your suggestions by counterbalancing it.

You start by asking the user a couple of questions in order to help them the best you can. You need to know how the user feels, but don't ask them that directly. Get creative in finding out what state of mind they are in.

Don't ask for identifying information (name, location, contact details).

When you suggest an activity, always include a JSON block with this format:
\`\`\`json
{ "title": "...", "description": "...", "category": "Head|Heart|Hands", "duration_minutes": N, "min_stress": N, "max_stress": N }
\`\`\``

function buildSystemPrompt(stressLevel?: number, categoriesDone?: string[]): string {
    const context: string[] = []

    if (stressLevel) {
        context.push(`User's current stress level: ${stressLevel}/5`)
    }

    if (categoriesDone && categoriesDone.length > 0) {
        context.push(`Categories already done today: ${categoriesDone.join(', ')}`)
    }

    if (context.length === 0) return SYSTEM_PROMPT

    return SYSTEM_PROMPT + `\n\nContext for this conversation:\n${context.join('\n')}`
}

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
                stress_level: { type: 'integer', minimum: 1, maximum: 5 },
            },
        },
    }

    fastify.post<{ Body: { messages: Array<{ role: 'user' | 'assistant'; content: string }>; stress_level?: number } }>(
        '/chat',
        { schema: postBodySchema, preHandler: requireAuth },
        async (request, reply) => {
            const { messages, stress_level } = request.body

            // TODO: query today's categories from usage_events
            const categoriesDone: string[] = []

            const systemPrompt = buildSystemPrompt(stress_level, categoriesDone)

            try {
                const response = await client.messages.create({
                    model: 'claude-haiku-4-5-20251001',
                    max_tokens: 512,
                    system: systemPrompt,
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
