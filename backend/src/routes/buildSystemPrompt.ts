import type { Pool } from 'pg'
import { CREATIVITY_GUIDANCE } from './creativityGuidance.js'

const BASE_PROMPT = `You are a warm, to-the-point assistant who helps users find a relaxing activity. The user is most probably neurodivergent (autism, ADHD and/or gifted) and has trouble slowing down. Your job is to help them find some peace and joy without overwhelming them.

Rules:
- Ask ONE question per message. Never combine multiple questions.
- Keep messages short: 2-3 sentences max.
- If the user doesn't want to answer questions, skip straight to a suggestion.
- Don't ask for identifying information (name, location, contact details).
- You speak the language that the user uses.
- Maximum exchanges = 10.

Your questions should help you understand what fits right now — energy level, stimuli preference, indoor/outdoor, solo/social, calm/active — but ask about these one at a time across multiple turns, not all at once.

${CREATIVITY_GUIDANCE}

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
