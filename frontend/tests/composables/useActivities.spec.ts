import { describe, it, expect, vi } from 'vitest'
import { api } from '../../src/api/client'
import { useActivities, resetActivitiesState } from '../../src/composables/useActivities'
import { pickWeighted } from '../../src/composables/suggestionWeighting'

vi.mock('../../src/composables/suggestionWeighting', () => ({ pickWeighted: vi.fn() }))

describe('useActivities', () => {
  describe('useActivities', () => {
    it('should populate activities and mark them loaded on a successful fetch', async () => {
      // Arrange
      resetActivitiesState()
      vi.mocked(api).mockResolvedValueOnce([{ id: '1', title: 'Wandelen', categories: ['Hands'] }])
      const { activities, loaded, fetchActivities } = useActivities()

      // Act
      await fetchActivities()

      // Assert
      expect(activities.value).toHaveLength(1)
      expect(loaded.value).toBe(true)
    })

    it('should flag an error when the fetch fails', async () => {
      // Arrange
      resetActivitiesState()
      vi.mocked(api).mockRejectedValueOnce(new Error('network down'))
      const { error, fetchActivities } = useActivities()

      // Act
      await fetchActivities()

      // Assert
      expect(error.value).toBe(true)
    })

    it('should report empty only once loaded with no activities', async () => {
      // Arrange
      resetActivitiesState()
      const { isEmpty, fetchActivities } = useActivities()
      expect(isEmpty.value).toBe(false)
      vi.mocked(api).mockResolvedValueOnce([])

      // Act
      await fetchActivities()

      // Assert
      expect(isEmpty.value).toBe(true)
    })

    it('should create an activity, sending the payload and rebuilding category names', async () => {
      // Arrange
      resetActivitiesState()
      const payload = {
        title: 'Wandelen',
        description: null,
        suggested_duration: 15,
        min_stress_level: 1,
        max_stress_level: 5,
        category_ids: [1, 3],
        source: 'user' as const,
      }
      vi.mocked(api).mockResolvedValueOnce({
        id: '7',
        title: 'Wandelen',
        description: null,
        suggested_duration: 15,
        min_stress_level: 1,
        max_stress_level: 5,
        source: 'user',
      })
      const { activities, createActivity } = useActivities()

      // Act
      const result = await createActivity(payload)

      // Assert
      expect(api).toHaveBeenCalledWith('/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      expect(result.categories).toEqual(['Head', 'Heart'])
      expect(activities.value).toContainEqual(result)
    })

    it('should rebuild category names when an update changes the categories', async () => {
      // Arrange
      resetActivitiesState()
      const { activities, updateActivity } = useActivities()
      activities.value = [
        // @ts-expect-error partial test activity
        { id: '4', title: 'Oud', categories: ['Heart'] },
      ]
      vi.mocked(api).mockResolvedValueOnce({ id: '4', title: 'Oud' })

      // Act
      const updated = await updateActivity('4', { category_ids: [1, 2] })

      // Assert
      expect(updated.categories).toEqual(['Head', 'Hands'])
    })

    it('should keep the previous categories when an update omits category_ids', async () => {
      // Arrange
      resetActivitiesState()
      const { activities, updateActivity } = useActivities()
      activities.value = [
        // @ts-expect-error partial test activity
        { id: '4', title: 'Oud', categories: ['Heart'] },
      ]
      vi.mocked(api).mockResolvedValueOnce({ id: '4', title: 'Nieuw' })

      // Act
      const updated = await updateActivity('4', { title: 'Nieuw' })

      // Assert
      expect(updated.categories).toEqual(['Heart'])
      expect(activities.value[0].title).toBe('Nieuw')
    })

    it('should remove an activity from the list when deleted', async () => {
      // Arrange
      resetActivitiesState()
      const { activities, deleteActivity } = useActivities()
      activities.value = [
        // @ts-expect-error partial test activity
        { id: '1', title: 'A' },
        // @ts-expect-error partial test activity
        { id: '2', title: 'B' },
      ]
      vi.mocked(api).mockResolvedValueOnce({ ok: true })

      // Act
      await deleteActivity('1')

      // Assert
      expect(api).toHaveBeenCalledWith('/activities/1', { method: 'DELETE' })
      expect(activities.value.map((activity) => activity.id)).toEqual(['2'])
    })

    it('should return only activities whose stress range covers the level', () => {
      // Arrange
      resetActivitiesState()
      const { activities, filterByStress } = useActivities()
      activities.value = [
        // @ts-expect-error partial test activity
        { id: '1', min_stress_level: 1, max_stress_level: 3 },
        // @ts-expect-error partial test activity
        { id: '2', min_stress_level: 4, max_stress_level: 5 },
      ]

      // Act
      const result = filterByStress(2)

      // Assert
      expect(result.map((activity) => activity.id)).toEqual(['1'])
    })

    it('should drop activities that fall in an excluded category', () => {
      // Arrange
      resetActivitiesState()
      const { activities, filterByExcludedCategories } = useActivities()
      activities.value = [
        // @ts-expect-error partial test activity
        { id: '1', categories: ['Head'] },
        // @ts-expect-error partial test activity
        { id: '2', categories: ['Hands'] },
      ]

      // Act
      const result = filterByExcludedCategories(['Head'])

      // Assert
      expect(result.map((activity) => activity.id)).toEqual(['2'])
    })

    it('should return null when there are no activities to suggest', () => {
      // Arrange
      resetActivitiesState()
      const { suggest } = useActivities()

      // Act
      const suggestion = suggest()

      // Assert
      expect(suggestion).toBeNull()
    })

    it('should suggest the activity chosen by the weighting', () => {
      // Arrange
      resetActivitiesState()
      const { activities, suggest } = useActivities()
      const chosen = {
        // @ts-expect-error partial test activity
        id: '1',
        source: 'base',
        min_stress_level: 1,
        max_stress_level: 5,
      }
      activities.value = [chosen]
      // @ts-expect-error partial test activity
      vi.mocked(pickWeighted).mockReturnValue(chosen)

      // Act
      const suggestion = suggest()

      // Assert
      expect(suggestion?.id).toBe('1')
    })
  })
})
