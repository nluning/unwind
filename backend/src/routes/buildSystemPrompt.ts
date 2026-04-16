import type { Pool } from 'pg'

const BASE_PROMPT = `You are a creative assistant who speaks to the point and helps the user think of an activity they can do to relax and wind down. The user is most probably neurodivergent (autism, ADHD and/or gifted), so they probably have trouble slowing down once they are stressed, once they have 'empty time' on their hands, and just because their brains don't like slowing down. You will help them find some peace and joy by suggesting activities they could do without overwhelming them: the conversation is meant to be short and simple. You speak to the point. Maximum exchanges = 10.

You speak the language that the user uses.

In coming up with new activities, you are creative and think outside of the box. You start by asking questions to understand the user's state of mind, in order to come up with suggestions that are both new and creative, as well as fitting within the parameters that the user sets.
Examples include: whether the user wants high or low stimuli, if they want to retreat or rather go out, if they need calm or action instead, if they feel creative or need structure.

Don't ask for identifying information (name, location, contact details).

If the user does not want to answer questions, just come up with activities that are creative and outside of the box.

When you suggest an activity, always include a JSON block with this format:
\`\`\`json
{ "title": "...", "description": "...", "category": "Head|Heart|Hands", "duration_minutes": N, "min_stress": N, "max_stress": N }
\`\`\``

export const MAX_MESSAGES = 20

// ── Database queries ────────────────────────────────────────────

interface UserContext {
    memories: string[]
    frequentlyAccepted: string[]
    frequentlySkipped: string[]
    doneToday: string[]
}

export async function getUserContext(pg: Pool, userId: string): Promise<UserContext> {
    // Run all three queries in parallel — they're independent
    const [memoriesResult, patternsResult, todayResult] = await Promise.all([
        pg.query(
            'SELECT fact FROM user_memories WHERE user_id = $1 ORDER BY created_at',
            [userId]
        ),
        pg.query(
            `SELECT a.title,
                    SUM(CASE WHEN ue.action = 'accepted' THEN 1 ELSE 0 END)::int AS accepted,
                    SUM(CASE WHEN ue.action = 'skipped' THEN 1 ELSE 0 END)::int AS skipped
             FROM usage_events ue
             JOIN activities a ON ue.activity_id = a.id
             WHERE ue.user_id = $1
             GROUP BY a.title
             ORDER BY accepted DESC, skipped DESC
             LIMIT 10`,
            [userId]
        ),
        pg.query(
            `SELECT DISTINCT a.title
             FROM usage_events ue
             JOIN activities a ON ue.activity_id = a.id
             WHERE ue.user_id = $1 AND ue.action = 'accepted'
               AND ue.created_at >= CURRENT_DATE`,
            [userId]
        ),
    ])

    const accepted = patternsResult.rows
        .filter(row => row.accepted > 0)
        .map(row => row.title)

    const skipped = patternsResult.rows
        .filter(row => row.skipped > 1)
        .map(row => row.title)

    return {
        memories: memoriesResult.rows.map(row => row.fact),
        frequentlyAccepted: accepted,
        frequentlySkipped: skipped,
        doneToday: todayResult.rows.map(row => row.title),
    }
}

// ── Prompt builder ──────────────────────────────────────────────

interface PromptOptions {
    messageCount: number
    stressLevel?: number
    userContext: UserContext
}

export function buildSystemPrompt(options: PromptOptions): string {
    const { messageCount, stressLevel, userContext } = options
    const sections: string[] = []

    // User memories (from onboarding / AI-learned / user-added)
    if (userContext.memories.length > 0) {
        sections.push(
            'What you know about this user:\n' +
            userContext.memories.map(fact => `- ${fact}`).join('\n')
        )
    }

    // Activity patterns
    const patterns: string[] = []
    if (userContext.frequentlyAccepted.length > 0) {
        patterns.push(`Frequently accepts: ${userContext.frequentlyAccepted.join(', ')}`)
    }
    if (userContext.frequentlySkipped.length > 0) {
        patterns.push(`Frequently skips: ${userContext.frequentlySkipped.join(', ')}`)
    }
    if (userContext.doneToday.length > 0) {
        patterns.push(`Done today: ${userContext.doneToday.join(', ')}`)
    }
    if (patterns.length > 0) {
        sections.push('Activity patterns:\n' + patterns.map(line => `- ${line}`).join('\n'))
    }

    // Per-request context
    if (stressLevel) {
        sections.push(`User's current stress level: ${stressLevel}/5`)
    }

    // Conversation limit warnings
    const remaining = MAX_MESSAGES - messageCount
    if (remaining <= 2) {
        sections.push('This is the last message in this conversation. Tell the user they can start a new conversation if they\'d like to continue.')
    } else if (remaining <= 6) {
        sections.push(`This conversation has ${remaining} messages left. Wrap up by making a suggestion soon.`)
    }

    if (sections.length === 0) return BASE_PROMPT

    return BASE_PROMPT + '\n\n' + sections.join('\n\n')
}
