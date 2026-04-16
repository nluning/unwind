import type { FastifyInstance } from 'fastify'
import Anthropic from '@anthropic-ai/sdk'
import { requireAuth } from '../middleware/auth.js'
import { createRateLimiter } from '../middleware/rateLimit.js'
import { ONBOARDING_SYSTEM_PROMPT, buildOnboardingUserMessage } from './onboardingPrompt.js'

const client = new Anthropic()

interface GeneratedActivity {
    title: string
    description: string
    category: 'Head' | 'Hands' | 'Heart'
    duration_minutes: number
    min_stress: number
    max_stress: number
}

interface OnboardingResult {
    activities: GeneratedActivity[]
    memories: string[]
}

async function getCategoryMap(fastify: FastifyInstance): Promise<Record<string, number>> {
    const result = await fastify.pg.query('SELECT id, name FROM categories')
    const map: Record<string, number> = {}
    for (const row of result.rows) {
        map[row.name] = row.id
    }
    return map
}

export function parseOnboardingResponse(text: string): OnboardingResult | null {
    // Try to extract JSON from markdown fences or bare JSON
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
    if (!jsonMatch) return null

    try {
        const parsed = JSON.parse(jsonMatch[1])

        if (!Array.isArray(parsed.activities) || !Array.isArray(parsed.memories)) {
            return null
        }

        // Validate each activity has required fields
        const validActivities = parsed.activities.filter((activity: any) =>
            typeof activity.title === 'string' &&
            typeof activity.category === 'string' &&
            typeof activity.duration_minutes === 'number' &&
            typeof activity.min_stress === 'number' &&
            typeof activity.max_stress === 'number' &&
            ['Head', 'Hands', 'Heart'].includes(activity.category) &&
            activity.min_stress >= 1 && activity.max_stress <= 5 &&
            activity.min_stress <= activity.max_stress
        )

        const validMemories = parsed.memories.filter(
            (memory: any) => typeof memory === 'string' && memory.length > 0
        )

        return { activities: validActivities, memories: validMemories }
    } catch {
        return null
    }
}

async function onboardingRoutes(fastify: FastifyInstance) {
    const onboardingRateLimit = createRateLimiter({ endpoint: 'onboarding', maxRequests: 3, window: 'total' })

    const bodySchema = {
        body: {
            type: 'object',
            required: ['setting', 'social', 'interests', 'memory_consent'],
            properties: {
                setting: { type: 'string', enum: ['indoor', 'outdoor', 'no_preference'] },
                social: { type: 'string', enum: ['alone', 'with_others', 'no_preference'] },
                interests: {
                    type: 'array',
                    items: { type: 'string' },
                    minItems: 0,
                },
                memory_consent: { type: 'boolean' },
            },
        },
    } as const

    fastify.post<{
        Body: {
            setting: 'indoor' | 'outdoor' | 'no_preference'
            social: 'alone' | 'with_others' | 'no_preference'
            interests: string[]
            memory_consent: boolean
        }
    }>(
        '/onboarding/generate',
        { schema: bodySchema, preHandler: [requireAuth, onboardingRateLimit] },
        async (request, reply) => {
            const userId = request.user!.id
            const { setting, social, interests, memory_consent } = request.body

            // Enable memory if user gave consent
            if (memory_consent) {
                await fastify.pg.query(
                    'UPDATE users SET memory_enabled = true WHERE id = $1',
                    [userId]
                )
            }

            // Build the prompt and call Claude
            const userMessage = buildOnboardingUserMessage({ setting, social, interests })

            let response
            try {
                response = await client.messages.create({
                    model: 'claude-haiku-4-5-20251001',
                    max_tokens: 2048,
                    system: ONBOARDING_SYSTEM_PROMPT,
                    messages: [{ role: 'user', content: userMessage }],
                })
            } catch (err: any) {
                if (err?.status === 429) {
                    reply.status(429).send({ error: 'AI service is busy. Try again in a moment.' })
                    return
                }
                fastify.log.error(err, 'Onboarding Claude API error')
                reply.status(503).send({ error: 'AI service is temporarily unavailable.' })
                return
            }

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
                'onboarding token usage'
            )

            const result = parseOnboardingResponse(text)
            if (!result || result.activities.length === 0) {
                fastify.log.error({ raw: text.slice(0, 500) }, 'Failed to parse onboarding response')
                reply.status(502).send({ error: 'Could not generate activities. Try again.' })
                return
            }

            // Look up category IDs from the database
            const categoryMap = await getCategoryMap(fastify)

            // Insert everything in a single transaction
            const dbClient = await fastify.pg.connect()
            try {
                await dbClient.query('BEGIN')

                // Insert activities + category links
                const insertedActivities = []
                for (const activity of result.activities) {
                    const activityResult = await dbClient.query(
                        `INSERT INTO activities (title, description, suggested_duration, min_stress_level, max_stress_level, source, user_id)
                         VALUES ($1, $2, $3, $4, $5, 'ai', $6)
                         RETURNING *`,
                        [
                            activity.title,
                            activity.description ?? null,
                            activity.duration_minutes,
                            activity.min_stress,
                            activity.max_stress,
                            userId,
                        ]
                    )

                    const inserted = activityResult.rows[0]
                    insertedActivities.push(inserted)

                    const categoryId = categoryMap[activity.category]
                    if (categoryId) {
                        await dbClient.query(
                            'INSERT INTO activity_categories (activity_id, category_id) VALUES ($1, $2)',
                            [inserted.id, categoryId]
                        )
                    }
                }

                // Insert memories (only if consent was given)
                if (memory_consent && result.memories.length > 0) {
                    for (const fact of result.memories) {
                        await dbClient.query(
                            `INSERT INTO user_memories (user_id, fact, source)
                             VALUES ($1, $2, 'onboarding')`,
                            [userId, fact]
                        )
                    }
                }

                await dbClient.query('COMMIT')

                reply.status(201).send({
                    activities: insertedActivities,
                    memories_saved: memory_consent ? result.memories.length : 0,
                })
            } catch (err) {
                await dbClient.query('ROLLBACK')
                throw err
            } finally {
                dbClient.release()
            }
        }
    )
}

export default onboardingRoutes
