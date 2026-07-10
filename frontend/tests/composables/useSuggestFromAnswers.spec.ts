import { describe, it, expect, vi } from 'vitest'
import { api, ApiError } from '../../src/api/client'
import { useActivities } from '../../src/composables/useActivities'
import { makeUseActivitiesMock } from '../../src/composables/__mocks__/useActivities'
import { useSuggestFromAnswers } from '../../src/composables/useSuggestFromAnswers'

vi.mock('../../src/composables/useActivities')

describe('useSuggestFromAnswers', () => {
  it('should present the activity the server suggests for the given answers', async () => {
    // Arrange
    vi.mocked(api).mockResolvedValueOnce({ activity: { title: 'Wandel even', category: 'Head', duration_minutes: 10 } })
    const { suggestion, generate } = useSuggestFromAnswers()

    // Act
    await generate({ location: 'outdoor', energy: 'active' })

    // Assert
    expect(suggestion.value?.title).toBe('Wandel even')
  })

  it('should send already-seen titles so "andere suggestie" varies the result', async () => {
    // Arrange
    vi.mocked(api).mockResolvedValueOnce({ activity: { title: 'Iets nieuws', category: 'Head', duration_minutes: 10 } })
    const { generate } = useSuggestFromAnswers()

    // Act
    await generate({ location: 'indoor' }, ['Wandel even'])

    // Assert
    expect(vi.mocked(api)).toHaveBeenCalledWith('/activities/suggest-from-answers', {
      method: 'POST',
      body: JSON.stringify({ location: 'indoor', exclude: ['Wandel even'] }),
    })
  })

  it('should surface the server message when the daily limit is hit', async () => {
    // Arrange
    vi.mocked(api).mockRejectedValueOnce(new ApiError(429, { error: 'Limiet bereikt' }))
    const { failed, rateLimitMessage, generate } = useSuggestFromAnswers()

    // Act
    await generate({ location: 'indoor' })

    // Assert
    expect(failed.value).toBe(true)
    expect(rateLimitMessage.value).toBe('Limiet bereikt')
  })

  it('should flag a generic failure without a rate-limit message', async () => {
    // Arrange
    vi.mocked(api).mockRejectedValueOnce(new Error('network down'))
    const { failed, rateLimitMessage, generate } = useSuggestFromAnswers()

    // Act
    await generate({ location: 'indoor' })

    // Assert
    expect(failed.value).toBe(true)
    expect(rateLimitMessage.value).toBeNull()
  })

  it('should persist a kept suggestion as a new activity with the mapped payload', async () => {
    // Arrange
    const createActivity = vi.fn()
    vi.mocked(useActivities).mockReturnValue(makeUseActivitiesMock({ createActivity }))
    const { save } = useSuggestFromAnswers()

    // Act
    await save({ title: 'Wandel even', category: 'Head', duration_minutes: 10 })

    // Assert
    expect(createActivity).toHaveBeenCalledWith({
      title: 'Wandel even',
      description: null,
      suggested_duration: 10,
      min_stress_level: 1,
      max_stress_level: 5,
      category_ids: [1],
      source: 'ai',
    })
  })
})
