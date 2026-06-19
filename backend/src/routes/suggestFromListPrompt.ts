
import { CREATIVITY_GUIDANCE } from './creativityGuidance.js'

export const SUGGESTION_COUNT = 3

export interface GeneratedActivity {
    title: string
    description: string
    category: 'Head' | 'Hands' | 'Heart'
    duration_minutes: number
    min_stress: number
    max_stress: number
}

export const SUGGEST_FROM_LIST_SYSTEM_PROMPT = `You suggest relaxing activities for Unwind, an app that helps people find relaxing activities when they can't switch off.

You receive a snapshot of one user — the activities they have added themselves, the ones they pick most often, and what the app knows about them — as structured data. You do NOT have a conversation and you NEVER ask questions. You reply with JSON only.

Generate exactly ${SUGGESTION_COUNT} NEW activities calibrated to this user, as a JSON array.

## Activity format

Each activity must have exactly these fields:
\`\`\`json
{
  "title": "string (Dutch, max 60 chars)",
  "description": "string (Dutch, 1-2 sentences, casual tone, max 150 chars)",
  "category": "Head" | "Hands" | "Heart",
  "duration_minutes": number (5, 10, 15, 20, 30, or 45),
  "min_stress": number (1-5),
  "max_stress": number (1-5, >= min_stress)
}
\`\`\`

## Activity guidelines

- Write in Dutch, warm and casual — like a friend suggesting something, not a therapist prescribing it.
- Be specific and concrete: "Teken je koffiemok met een pen", not "Doe iets creatiefs".
- These must be NEW — don't re-suggest activities the user already has.

## Creativity

${CREATIVITY_GUIDANCE}

Of the ${SUGGESTION_COUNT} suggestions, make roughly one squarely familiar (close to what this user already does or picks) and the rest adjacent-but-new. Include a more divergent suggestion only when the user's own list and picks clearly show they welcome variety.

## Output format

Return ONLY this JSON object, no other text:
\`\`\`json
{ "activities": [ ... ${SUGGESTION_COUNT} activities ... ] }
\`\`\``

export interface SuggestFromListContext {
    addedActivities: string[]
    frequentlyAccepted: string[]
    memories: string[]
    doneToday?: string[]
    seed?: { title: string; description: string | null }
}

export function buildSuggestFromListUserMessage(context: SuggestFromListContext): string {
    const lines: string[] = []

    if (context.seed) {
        const seedDescription = context.seed.description ? ` — ${context.seed.description}` : ''
        lines.push(
            `De gebruiker wil meer activiteiten in de geest van deze: '${context.seed.title}'${seedDescription}. ` +
            `Stel ${SUGGESTION_COUNT} activiteiten voor die hier qua sfeer, energie en categorie dicht bij liggen, maar wel nieuw zijn — geen herhaling van deze activiteit zelf.`
        )
    }

    if (context.addedActivities.length > 0) {
        lines.push(`Activiteiten die de gebruiker zelf heeft toegevoegd: ${context.addedActivities.join(', ')}`)
    }
    if (context.frequentlyAccepted.length > 0) {
        lines.push(`Kiest het vaakst: ${context.frequentlyAccepted.join(', ')}`)
    }
    if (context.doneToday && context.doneToday.length > 0) {
        lines.push(`Heeft vandaag al gedaan (stel deze niet opnieuw voor): ${context.doneToday.join(', ')}`)
    }
    if (context.memories.length > 0) {
        lines.push('Wat de app over de gebruiker weet:\n' + context.memories.map((fact) => `- ${fact}`).join('\n'))
    }

    if (lines.length === 0) {
        return 'Deze gebruiker is nieuw en heeft nog geen activiteiten toegevoegd of gekozen. Stel laagdrempelige, breed aansprekende activiteiten voor die weinig uitleg of planning vragen.'
    }

    return lines.join('\n')
}

export function isValidActivity(activity: unknown): activity is GeneratedActivity {
    if (typeof activity !== 'object' || activity === null) return false
    const candidate = activity as Record<string, unknown>
    return (
        typeof candidate.title === 'string' &&
        typeof candidate.category === 'string' &&
        typeof candidate.duration_minutes === 'number' &&
        typeof candidate.min_stress === 'number' &&
        typeof candidate.max_stress === 'number' &&
        ['Head', 'Hands', 'Heart'].includes(candidate.category) &&
        candidate.min_stress >= 1 && candidate.max_stress <= 5 &&
        candidate.min_stress <= candidate.max_stress
    )
}

export function parseSuggestionsResponse(text: string): GeneratedActivity[] | null {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
    if (!jsonMatch) return null

    try {
        const parsed = JSON.parse(jsonMatch[1]!)
        if (!Array.isArray(parsed.activities)) return null
        return parsed.activities.filter(isValidActivity).slice(0, SUGGESTION_COUNT)
    } catch {
        return null
    }
}
