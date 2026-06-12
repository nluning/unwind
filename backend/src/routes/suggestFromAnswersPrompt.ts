import { CREATIVITY_GUIDANCE } from './creativityGuidance.js'
import { type GeneratedActivity, isValidActivity } from './suggestFromListPrompt.js'

export type { GeneratedActivity }

export interface QuickAnswers {
    location?: 'indoor' | 'outdoor'
    social?: 'alone' | 'with_others'
    energy?: 'calm' | 'active'
}

export const SUGGEST_FROM_ANSWERS_SYSTEM_PROMPT = `You suggest a relaxing activity for Unwind, an app that helps people find relaxing activities when they can't switch off.

You receive a snapshot of one user — what they want right now, the activities they have added themselves, the ones they pick most often, and what the app knows about them — as structured data. You do NOT have a conversation and you NEVER ask questions. You reply with JSON only.

Generate exactly ONE activity calibrated to this user and their current context.

## Right now

The "right now" lines describe the user's current moment (indoors/outdoors, alone/with someone, calm/active). Treat them as constraints for THIS suggestion — don't suggest going outside if they said indoors, or something energetic if they want calm. If a dimension is absent the user has no preference on it; use your judgement from their history.

## Activity format

The activity must have exactly these fields:
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
- Suggest something the user can start now, in the moment they described.

## Creativity

${CREATIVITY_GUIDANCE}

## Output format

Return ONLY this JSON object, no other text:
\`\`\`json
{ "activity": { ... } }
\`\`\``

export interface SuggestFromAnswersContext {
    answers: QuickAnswers
    addedActivities: string[]    // titles of the user's own activities
    frequentlyAccepted: string[] // titles the user picks most often
    memories: string[]           // what the app knows about the user
    exclude?: string[]           // titles already shown this session — don't repeat them
}

const LOCATION_LABEL: Record<NonNullable<QuickAnswers['location']>, string> = {
    indoor: 'Binnen',
    outdoor: 'Buiten',
}
const SOCIAL_LABEL: Record<NonNullable<QuickAnswers['social']>, string> = {
    alone: 'Alleen',
    with_others: 'Met iemand',
}
const ENERGY_LABEL: Record<NonNullable<QuickAnswers['energy']>, string> = {
    calm: 'Iets rustigs',
    active: 'Iets actiefs',
}

export function buildSuggestFromAnswersUserMessage(context: SuggestFromAnswersContext): string {
    const { answers } = context

    const nowLines: string[] = []
    if (answers.location) nowLines.push(`- ${LOCATION_LABEL[answers.location]}`)
    if (answers.social) nowLines.push(`- ${SOCIAL_LABEL[answers.social]}`)
    if (answers.energy) nowLines.push(`- ${ENERGY_LABEL[answers.energy]}`)

    const historyLines: string[] = []
    if (context.addedActivities.length > 0) {
        historyLines.push(`Activiteiten die de gebruiker zelf heeft toegevoegd: ${context.addedActivities.join(', ')}`)
    }
    if (context.frequentlyAccepted.length > 0) {
        historyLines.push(`Kiest het vaakst: ${context.frequentlyAccepted.join(', ')}`)
    }
    if (context.memories.length > 0) {
        historyLines.push('Wat de app over de gebruiker weet:\n' + context.memories.map((fact) => `- ${fact}`).join('\n'))
    }

    const excludeSection =
        context.exclude && context.exclude.length > 0
            ? 'Je hebt deze activiteiten al voorgesteld — stel iets anders voor, niet deze:\n' +
              context.exclude.map((title) => `- ${title}`).join('\n')
            : null

    if (nowLines.length === 0 && historyLines.length === 0) {
        const coldStart =
            'Deze gebruiker is nieuw, heeft nog geen activiteiten toegevoegd of gekozen en geen voorkeur opgegeven. Stel één laagdrempelige, breed aansprekende activiteit voor die weinig uitleg of planning vraagt.'
        // Even with no register, a regenerate must vary — keep the exclude list.
        return excludeSection ? `${coldStart}\n\n${excludeSection}` : coldStart
    }

    const sections: string[] = []
    if (nowLines.length > 0) {
        sections.push('Wat de gebruiker nu wil:\n' + nowLines.join('\n'))
    }
    if (historyLines.length > 0) {
        sections.push(historyLines.join('\n'))
    }
    if (excludeSection) {
        sections.push(excludeSection)
    }
    return sections.join('\n\n')
}

export function parseSingleSuggestion(text: string): GeneratedActivity | null {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
    if (!jsonMatch) return null

    try {
        const parsed = JSON.parse(jsonMatch[1]!)
        const candidate = parsed.activity ?? parsed
        return isValidActivity(candidate) ? candidate : null
    } catch {
        return null
    }
}
