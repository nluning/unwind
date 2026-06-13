import { describe, it, expect } from 'vitest'
import {
    parseSingleSuggestion,
    buildSuggestFromAnswersUserMessage,
} from '../../src/routes/suggestFromAnswersPrompt.js'

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

describe('parseSingleSuggestion', () => {
    it('parses a fenced { activity } wrapper', () => {
        const text = '```json\n' + JSON.stringify({ activity: activity() }) + '\n```'
        const result = parseSingleSuggestion(text)
        expect(result).not.toBeNull()
        expect(result!.title).toBe('Teken iets')
    })

    it('parses a bare activity object (no wrapper, no fences)', () => {
        const text = JSON.stringify(activity({ title: 'Wandel even' }))
        expect(parseSingleSuggestion(text)!.title).toBe('Wandel even')
    })

    it('returns null on a malformed activity (bad category)', () => {
        const text = JSON.stringify({ activity: activity({ category: 'Invalid' }) })
        expect(parseSingleSuggestion(text)).toBeNull()
    })

    it('returns null on inverted stress range', () => {
        const text = JSON.stringify({ activity: activity({ min_stress: 5, max_stress: 1 }) })
        expect(parseSingleSuggestion(text)).toBeNull()
    })

    it('returns null when no JSON is present', () => {
        expect(parseSingleSuggestion('Hier is een suggestie!')).toBeNull()
    })

    it('returns null on malformed JSON', () => {
        expect(parseSingleSuggestion('```json\n{ broken }\n```')).toBeNull()
    })
})

describe('buildSuggestFromAnswersUserMessage', () => {
    it('renders the answered dimensions as "right now" constraints', () => {
        const message = buildSuggestFromAnswersUserMessage({
            answers: { location: 'outdoor', social: 'alone', energy: 'active' },
            addedActivities: [],
            frequentlyAccepted: [],
            memories: [],
        })
        expect(message).toContain('nu wil')
        expect(message).toContain('Buiten')
        expect(message).toContain('Alleen')
        expect(message).toContain('Iets actiefs')
    })

    it('omits skipped (no-preference) dimensions', () => {
        const message = buildSuggestFromAnswersUserMessage({
            answers: { location: 'indoor' }, // social + energy skipped
            addedActivities: ['Linosnede maken'],
            frequentlyAccepted: [],
            memories: [],
        })
        expect(message).toContain('Binnen')
        expect(message).not.toContain('Alleen')
        expect(message).not.toContain('Met iemand')
        expect(message).not.toContain('rustigs')
        expect(message).not.toContain('actiefs')
        // history still layered in
        expect(message).toContain('Linosnede maken')
    })

    it('layers history below the answers when both are present', () => {
        const message = buildSuggestFromAnswersUserMessage({
            answers: { energy: 'calm' },
            addedActivities: ['Thee zetten'],
            frequentlyAccepted: ['Lezen'],
            memories: ['Houdt van handwerken'],
        })
        expect(message).toContain('Iets rustigs')
        expect(message).toContain('Thee zetten')
        expect(message).toContain('Lezen')
        expect(message).toContain('Houdt van handwerken')
    })

    it('falls back to a cold-start instruction when all questions skipped and no history', () => {
        const message = buildSuggestFromAnswersUserMessage({
            answers: {},
            addedActivities: [],
            frequentlyAccepted: [],
            memories: [],
        })
        // No "add more first" gate — must still ask for one low-effort suggestion.
        expect(message).toContain('nieuw')
        expect(message.toLowerCase()).toContain('laagdrempelige')
    })

    it('uses history alone when all questions are skipped but history exists', () => {
        const message = buildSuggestFromAnswersUserMessage({
            answers: {},
            addedActivities: ['Puzzelen'],
            frequentlyAccepted: [],
            memories: [],
        })
        expect(message).not.toContain('nu wil')
        expect(message).toContain('Puzzelen')
    })

    it('asks for something different when given an exclude list (regenerate)', () => {
        const message = buildSuggestFromAnswersUserMessage({
            answers: { energy: 'calm' },
            addedActivities: [],
            frequentlyAccepted: [],
            memories: [],
            exclude: ['Thee zetten', 'Adem vijf keer langzaam'],
        })
        expect(message).toContain('al voorgesteld')
        expect(message).toContain('Thee zetten')
        expect(message).toContain('Adem vijf keer langzaam')
    })

    it('keeps the exclude list even on a cold-start regenerate', () => {
        const message = buildSuggestFromAnswersUserMessage({
            answers: {},
            addedActivities: [],
            frequentlyAccepted: [],
            memories: [],
            exclude: ['Wandel een rondje'],
        })
        expect(message).toContain('nieuw') // still cold-start
        expect(message).toContain('al voorgesteld')
        expect(message).toContain('Wandel een rondje')
    })
})
