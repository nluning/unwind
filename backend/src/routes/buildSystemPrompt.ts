import type { Pool } from 'pg'

const BASE_PROMPT = `You are a warm, concise assistant inside Unwind, an app that suggests relaxing activities to people who have trouble switching off. The user was just shown a specific activity and opened this chat to talk about THAT activity. They are most probably neurodivergent (autism, ADHD and/or gifted) and easily overwhelmed — stay calm, concrete and brief.

They usually want one of three things:
- Specification — e.g. "which book?", "where do I find a crossword?". Give a concrete answer: name a couple of options, or say where to look (a link is great).
- Adjustment — e.g. "I can't go outside, but I liked this — something similar at home?". Offer a close variant that keeps what they liked and is easy to start; keep it recognizably near the original, don't reach for novel or out-of-the-box ideas.
- Clarification — e.g. "what do you mean, fold a paper?". Explain simply, step by step if it helps.

Guidelines:
- Keep replies short: 1-2 sentences, one idea at a time.
- Be specific and practical — a concrete next step, a name, or a link beats vague encouragement.
- Answer directly; don't interrogate. Ask a question only when you genuinely can't help without one.
- Reply in the language the user writes in.
- Never ask for identifying information (name, location, contact details).

When — and only when — you propose a concrete activity the user could save, include a JSON block in this format:
\`\`\`json
{ "title": "...", "description": "...", "category": "Head|Heart|Hands", "duration_minutes": N, "min_stress": N, "max_stress": N }
\`\`\``

export const MAX_MESSAGES = 30

// ── Database queries ────────────────────────────────────────────

interface UserContext {
    memories: string[]
    frequentlyAccepted: string[]
    doneToday: string[]
}

export async function getUserContext(pg: Pool, userId: string): Promise<UserContext> {
    const [memoriesResult, patternsResult, todayResult] = await Promise.all([
        pg.query(
            'SELECT fact FROM user_memories WHERE user_id = $1 ORDER BY created_at',
            [userId]
        ),
        pg.query(
            `SELECT a.title,
                    SUM(CASE WHEN ue.action = 'accepted' THEN 1 ELSE 0 END)::int AS accepted
             FROM usage_events ue
             JOIN activities a ON ue.activity_id = a.id
             WHERE ue.user_id = $1
             GROUP BY a.title
             ORDER BY accepted DESC
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

    return {
        memories: memoriesResult.rows.map(row => row.fact),
        frequentlyAccepted: accepted,
        doneToday: todayResult.rows.map(row => row.title),
    }
}

// ── Prompt builder ──────────────────────────────────────────────

interface PromptOptions {
    messageCount: number
    stressLevel?: number
    userContext: UserContext
    activityContext?: { title: string; description?: string }
}

export function buildSystemPrompt(options: PromptOptions): string {
    const { messageCount, stressLevel, userContext, activityContext } = options
    const sections: string[] = []

    if (activityContext) {
        const description = activityContext.description ? ` — ${activityContext.description}` : ''
        sections.push(
            `The activity they were shown is: '${activityContext.title}'${description}. Keep your help focused on this one.`
        )
    }

    if (userContext.memories.length > 0) {
        sections.push(
            'The user has told you the following about themselves and what they like, in their own words:\n' +
            userContext.memories.map(fact => `- ${fact}`).join('\n')
        )
    }

    if (stressLevel) {
        sections.push(`User's current stress level: ${stressLevel}/5`)
    }

    const remaining = MAX_MESSAGES - messageCount
    if (remaining <= 2) {
        sections.push('This is the final reply in this chat. Answer their point, then warmly let them know the conversation ends here.')
    } else if (remaining <= 6) {
        sections.push('Only a few messages left in this chat — start gently steering it toward a calm, natural close.')
    }

    if (sections.length === 0) return BASE_PROMPT

    return BASE_PROMPT + '\n\n' + sections.join('\n\n')
}
