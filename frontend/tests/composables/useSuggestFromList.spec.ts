import { describe, it, expect, vi } from 'vitest'
import { api, ApiError } from '../../src/api/client'
import { useActivities } from '../../src/composables/useActivities'
import { makeUseActivitiesMock } from '../../src/composables/__mocks__/useActivities'
import { useSuggestFromList } from '../../src/composables/useSuggestFromList'

vi.mock('../../src/composables/useActivities')

describe('useSuggestFromList', () => {
  it('should anchor the batch to the seed activity for "meer van dit"', async () => {
    // Arrange
    vi.mocked(api).mockResolvedValueOnce({ activities: [] })
    const { generate } = useSuggestFromList()

    // Act
    await generate('seed-123')

    // Assert
    expect(vi.mocked(api)).toHaveBeenCalledWith('/activities/suggest-from-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seed_activity_id: 'seed-123' }),
    })
  })

  it('should send no body for the generic whole-library suggestion', async () => {
    // Arrange
    vi.mocked(api).mockResolvedValueOnce({ activities: [] })
    const { generate } = useSuggestFromList()

    // Act
    await generate()

    // Assert
    expect(vi.mocked(api)).toHaveBeenCalledWith('/activities/suggest-from-list', { method: 'POST' })
  })

  it('should present the batch of activities the server returns', async () => {
    // Arrange
    vi.mocked(api).mockResolvedValueOnce({
      activities: [
        { title: 'Wandel even', category: 'Head', duration_minutes: 10 },
        { title: 'Rek je uit', category: 'Hands', duration_minutes: 5 },
      ],
    })
    const { suggestions, generate } = useSuggestFromList()

    // Act
    await generate()

    // Assert
    expect(suggestions.value.map((activity) => activity.title)).toEqual(['Wandel even', 'Rek je uit'])
  })

  it('should surface the server message when the daily limit is hit', async () => {
    // Arrange
    vi.mocked(api).mockRejectedValueOnce(new ApiError(429, { error: 'Limiet bereikt' }))
    const { failed, rateLimitMessage, generate } = useSuggestFromList()

    // Act
    await generate('seed-123')

    // Assert
    expect(failed.value).toBe(true)
    expect(rateLimitMessage.value).toBe('Limiet bereikt')
  })

  it('should persist a chosen suggestion as a new activity with the mapped payload', async () => {
    // Arrange
    const createActivity = vi.fn()
    vi.mocked(useActivities).mockReturnValue(makeUseActivitiesMock({ createActivity }))
    const { save } = useSuggestFromList()

    // Act
    await save({ title: 'Rek je uit', category: 'Hands', duration_minutes: 5 })

    // Assert
    expect(createActivity).toHaveBeenCalledWith({
      title: 'Rek je uit',
      description: null,
      suggested_duration: 5,
      min_stress_level: 1,
      max_stress_level: 5,
      category_ids: [2],
      source: 'ai',
    })
  })
})
