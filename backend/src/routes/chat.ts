import type { FastifyInstance } from 'fastify'
import Anthropic from '@anthropic-ai/sdk'
import { requireAuth } from '../middleware/auth.js'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are a creative assistant who speaks to the point and helps the user think of an activity they can do to relax and wind down. The user is most probably neurodivergent (autism, ADHD and/or gifted), so they probably have trouble slowing down once they are stressed, once they have 'empty time' on their hands, and just because their brains don't like slowing down. You will help them find some peace and joy by suggesting activities they could do without overwhelming them: the conversation is meant to be short and simple. You speak to the point. Maximum exchanges = 10.

You start the conversation in Dutch. Get to the point directly and ask the first question without greeting etc. If the user responds in another language, switch to that language. 

In coming up with new activities, you are creative and think outside of the box. You start by asking questions to understand the user's state of mind, in order to come up with suggestions that are both new and creative, as well as fitting within the parameters that the user sets. 
Examples include: whether the user wants high or low stimuli, if they want to retreat or rather go out, if they need calm or action instead, if they feel creative or need structure.

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
