import { describe, it, expect, vi } from 'vitest'
import { api } from '../../src/api/client'
import { useActivities } from '../../src/composables/useActivities'
import type { Activity } from '../../src/types/activity'

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: '1',
    title: 'Walk',
    description: null,
    suggested_duration: 15,
    min_stress_level: 1,
    max_stress_level: 5,
    source: 'base',
    times_skipped: 0,
    categories: ['Hands'],
    ...overrides,
  }
}

describe('useActivities', () => {
  it('should populate activities from API on fetch', async () => {
    // Arrange
    const { activities, loaded, fetchActivities } = useActivities()
    activities.value = []
    loaded.value = false
    vi.mocked(api).mockResolvedValueOnce([makeActivity()])

    // Act
    await fetchActivities()

    // Assert
    expect(activities.value).toHaveLength(1)
    expect(activities.value[0].title).toBe('Walk')
    expect(loaded.value).toBe(true)
  })

  it('should filter activities matching a given stress level', () => {
    // Arrange
    const { activities, filterByStress } = useActivities()
    activities.value = [
      makeActivity({ id: '1', min_stress_level: 1, max_stress_level: 3 }),
      makeActivity({ id: '2', min_stress_level: 4, max_stress_level: 5 }),
      makeActivity({ id: '3', min_stress_level: 2, max_stress_level: 4 }),
    ]

    // Act
    const result = filterByStress(2)

    // Assert
    expect(result).toHaveLength(2)
    expect(result.map((a) => a.id)).toEqual(['1', '3'])
  })

  it('should exclude activities with any of the specified categories', () => {
    // Arrange
    const { activities, filterByExcludedCategories } = useActivities()
    activities.value = [
      makeActivity({ id: '1', categories: ['Head'] }),
      makeActivity({ id: '2', categories: ['Hands'] }),
      makeActivity({ id: '3', categories: ['Heart'] }),
    ]

    // Act
    const result = filterByExcludedCategories(['Head', 'Hands'])

    // Assert
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('3')
  })

  it('should not suggest already-accepted activities', () => {
    // Arrange
    const { activities, suggest, markAccepted } = useActivities()
    activities.value = [
      makeActivity({ id: '1' }),
      makeActivity({ id: '2' }),
    ]
    markAccepted('1')

    // Act
    const suggested = suggest()

    // Assert
    expect(suggested?.id).toBe('2')
  })

  it('should return null when all activities are accepted', () => {
    // Arrange
    const { activities, suggest, markAccepted } = useActivities()
    activities.value = [makeActivity({ id: '1' })]
    markAccepted('1')

    // Act
    const suggested = suggest()

    // Assert
    expect(suggested).toBeNull()
  })

  it('should clear session state on resetSession', () => {
    // Arrange
    const { activities, suggest, markAccepted, resetSession } = useActivities()
    activities.value = [makeActivity({ id: '1' })]
    markAccepted('1')
    expect(suggest()).toBeNull()

    // Act
    resetSession()

    // Assert
    expect(suggest()).not.toBeNull()
  })

  it('should add created activity to local state with reconstructed categories', async () => {
    // Arrange
    const { activities, createActivity } = useActivities()
    activities.value = []
    vi.mocked(api).mockResolvedValueOnce({
      id: '99',
      title: 'Meditate',
      description: null,
      suggested_duration: 10,
      min_stress_level: 1,
      max_stress_level: 5,
      source: 'user',
      category_ids: [1, 3],
    })

    // Act
    const created = await createActivity({
      title: 'Meditate',
      description: null,
      suggested_duration: 10,
      min_stress_level: 1,
      max_stress_level: 5,
      category_ids: [1, 3],
    })

    // Assert
    expect(created.categories).toEqual(['Head', 'Heart'])
    expect(created.times_skipped).toBe(0)
    expect(activities.value).toHaveLength(1)
    expect(activities.value[0].id).toBe('99')
  })

  it('should report isEmpty when loaded but no activities exist', () => {
    // Arrange
    const { activities, loaded, isEmpty } = useActivities()
    activities.value = []
    loaded.value = true

    // Act & Assert
    expect(isEmpty.value).toBe(true)
  })
})
