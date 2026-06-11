import { describe, it, expect } from 'vitest'
import {
    parseSuggestionsResponse,
    buildSuggestFromListUserMessage,
    SUGGESTION_COUNT,
} from '../../src/routes/suggestFromListPrompt.js'

function activity(overrides: Record<string, unknown> = {}) {
    return {
        title: 'Teken iets',
        description: 'Krabbel wat',
        category: 'Hands',
        duration_minutes: 10,
        min_stress: 1,
        max_stress: 3,
        ...overrides,
    }
}

describe('parseSuggestionsResponse', () => {
    it('parses a valid fenced JSON response', () => {
        const text = '```json\n' + JSON.stringify({ activities: [activity()] }) + '\n```'
        const result = parseSuggestionsResponse(text)
        expect(result).not.toBeNull()
        expect(result).toHaveLength(1)
        expect(result![0]!.title).toBe('Teken iets')
    })

    it('parses bare JSON (no fences)', () => {
        const text = JSON.stringify({ activities: [activity()] })
        expect(parseSuggestionsResponse(text)).toHaveLength(1)
    })

    it('caps an over-generating model to SUGGESTION_COUNT', () => {
        const text = JSON.stringify({
            activities: Array.from({ length: 5 }, (_unused, index) => activity({ title: `A${index}` })),
        })
        const result = parseSuggestionsResponse(text)
        expect(result).toHaveLength(SUGGESTION_COUNT) // 5 in → 3 out
    })

    it('returns fewer than 3 when the model under-generates (cannot fabricate)', () => {
        const text = JSON.stringify({ activities: [activity(), activity({ title: 'Tweede' })] })
        expect(parseSuggestionsResponse(text)).toHaveLength(2)
    })

    it('filters out malformed activities (bad category / inverted stress)', () => {
        const text = JSON.stringify({
            activities: [
                activity(), // valid
                activity({ title: 'Bad cat', category: 'Invalid' }),
                activity({ title: 'Inverted', min_stress: 5, max_stress: 1 }),
            ],
        })
        const result = parseSuggestionsResponse(text)
        expect(result).toHaveLength(1)
        expect(result![0]!.title).toBe('Teken iets')
    })

    it('returns null when no JSON is present', () => {
        expect(parseSuggestionsResponse('Hier zijn wat suggesties!')).toBeNull()
    })

    it('returns null on malformed JSON', () => {
        expect(parseSuggestionsResponse('```json\n{ broken }\n```')).toBeNull()
    })

    it('returns null when activities is not an array', () => {
        expect(parseSuggestionsResponse(JSON.stringify({ activities: 'nope' }))).toBeNull()
    })
})

describe('buildSuggestFromListUserMessage', () => {
    it('includes the user register when present', () => {
        const message = buildSuggestFromListUserMessage({
            addedActivities: ['Linosnede maken'],
            frequentlyAccepted: ['Thee zetten'],
            memories: ['Houdt van handwerken'],
        })
        expect(message).toContain('Linosnede maken')
        expect(message).toContain('Thee zetten')
        expect(message).toContain('Houdt van handwerken')
    })

    it('falls back to a cold-start instruction when there is no signal', () => {
        const message = buildSuggestFromListUserMessage({
            addedActivities: [],
            frequentlyAccepted: [],
            memories: [],
        })
        // No "add more first" gate — it must still ask for low-effort suggestions.
        expect(message).toContain('nieuw')
        expect(message.toLowerCase()).toContain('laagdrempelige')
    })
})
