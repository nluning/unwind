import { describe, it, expect } from 'vitest'
import { parseOnboardingResponse } from '../../src/routes/onboarding.js'

describe('parseOnboardingResponse', () => {
  it('parses a valid JSON response with markdown fences', () => {
    const text = '```json\n' + JSON.stringify({
      activities: [
        { title: 'Teken iets', description: 'Krabbel wat', category: 'Hands', duration_minutes: 10, min_stress: 1, max_stress: 3 },
      ],
      memories: ['Houdt van tekenen'],
    }) + '\n```'

    const result = parseOnboardingResponse(text)

    expect(result).not.toBeNull()
    expect(result!.activities).toHaveLength(1)
    expect(result!.activities[0].title).toBe('Teken iets')
    expect(result!.memories).toEqual(['Houdt van tekenen'])
  })

  it('parses bare JSON (no markdown fences)', () => {
    const text = JSON.stringify({
      activities: [
        { title: 'Lees een boek', description: 'Fictie', category: 'Head', duration_minutes: 30, min_stress: 1, max_stress: 4 },
      ],
      memories: ['Leest graag'],
    })

    const result = parseOnboardingResponse(text)

    expect(result).not.toBeNull()
    expect(result!.activities).toHaveLength(1)
  })

  it('returns null when no JSON is found', () => {
    const result = parseOnboardingResponse('Hier zijn wat activiteiten voor je!')
    expect(result).toBeNull()
  })

  it('returns null when JSON is malformed', () => {
    const result = parseOnboardingResponse('```json\n{ broken json }\n```')
    expect(result).toBeNull()
  })

  it('returns null when activities or memories array is missing', () => {
    const text = JSON.stringify({ activities: [{ title: 'Test' }] })
    const result = parseOnboardingResponse(text)
    expect(result).toBeNull()
  })

  it('filters out activities with invalid category', () => {
    const text = JSON.stringify({
      activities: [
        { title: 'Good', description: 'Fine', category: 'Head', duration_minutes: 10, min_stress: 1, max_stress: 3 },
        { title: 'Bad', description: 'Nope', category: 'Invalid', duration_minutes: 10, min_stress: 1, max_stress: 3 },
      ],
      memories: ['Test'],
    })

    const result = parseOnboardingResponse(text)

    expect(result!.activities).toHaveLength(1)
    expect(result!.activities[0].title).toBe('Good')
  })

  it('filters out activities with invalid stress range', () => {
    const text = JSON.stringify({
      activities: [
        { title: 'Good', description: 'Fine', category: 'Head', duration_minutes: 10, min_stress: 1, max_stress: 5 },
        { title: 'Inverted', description: 'Bad', category: 'Head', duration_minutes: 10, min_stress: 5, max_stress: 1 },
        { title: 'Out of range', description: 'Bad', category: 'Head', duration_minutes: 10, min_stress: 0, max_stress: 6 },
      ],
      memories: ['Test'],
    })

    const result = parseOnboardingResponse(text)

    expect(result!.activities).toHaveLength(1)
    expect(result!.activities[0].title).toBe('Good')
  })

  it('filters out activities missing required fields', () => {
    const text = JSON.stringify({
      activities: [
        { title: 'Complete', description: 'Full', category: 'Heart', duration_minutes: 15, min_stress: 1, max_stress: 4 },
        { title: 'No category', description: 'Missing', duration_minutes: 15, min_stress: 1, max_stress: 4 },
        { description: 'No title', category: 'Head', duration_minutes: 15, min_stress: 1, max_stress: 4 },
      ],
      memories: ['Test'],
    })

    const result = parseOnboardingResponse(text)

    expect(result!.activities).toHaveLength(1)
    expect(result!.activities[0].title).toBe('Complete')
  })

  it('filters out empty strings from memories', () => {
    const text = JSON.stringify({
      activities: [
        { title: 'Test', description: 'Test', category: 'Head', duration_minutes: 10, min_stress: 1, max_stress: 3 },
      ],
      memories: ['Valid memory', '', '  '],
    })

    const result = parseOnboardingResponse(text)

    // Empty strings filtered, but '  ' passes because it's not empty (just whitespace)
    expect(result!.memories).toHaveLength(2)
    expect(result!.memories[0]).toBe('Valid memory')
  })
})
