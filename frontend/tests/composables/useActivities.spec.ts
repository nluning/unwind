import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { api, NetworkError } from '../../src/api/client'
import { useActivities, resetActivitiesState } from '../../src/composables/useActivities'
import { pickWeighted } from '../../src/composables/suggestionWeighting'
import { useAuth } from '../../src/composables/useAuth'
import { loadActivities, saveActivities } from '../../src/utils/localDb'
import type { Activity } from '../../src/types/activity'

vi.mock('../../src/composables/suggestionWeighting', () => ({ pickWeighted: vi.fn() }))
vi.mock('../../src/composables/useAuth', () => ({ useAuth: vi.fn(() => ({ user: ref(null) })) }))
vi.mock('../../src/utils/localDb', () => ({
  loadActivities: vi.fn().mockResolvedValue(null),
  saveActivities: vi.fn().mockResolvedValue(undefined),
}))

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
    expect(activities.value[0]!.title).toBe('Nieuw')
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
      id: '1',
      source: 'base',
      min_stress_level: 1,
      max_stress_level: 5,
    }
    // @ts-expect-error partial test activity
    activities.value = [chosen]
    // @ts-expect-error partial test activity
    vi.mocked(pickWeighted).mockReturnValue(chosen)

    // Act
    const suggestion = suggest()

    // Assert
    expect(suggestion?.id).toBe('1')
  })

  describe('offline snapshot', () => {
    const snapshot = [{ id: 's1', title: 'Uit snapshot' }] as Activity[]
    const fresh = [{ id: 'f1', title: 'Van server' }] as Activity[]

    beforeEach(() => {
      resetActivitiesState()
      vi.mocked(loadActivities).mockReset().mockResolvedValue(null)
      vi.mocked(saveActivities).mockReset().mockResolvedValue(undefined)
      vi.mocked(useAuth).mockReturnValue({ user: ref({ id: 'user-1' }) } as unknown as ReturnType<typeof useAuth>)
    })

    it('should show the snapshot while the server has not answered yet', async () => {
      // Arrange
      vi.mocked(loadActivities).mockResolvedValue(snapshot)
      let answer!: (value: Activity[]) => void
      vi.mocked(api).mockReturnValueOnce(new Promise((resolve) => { answer = resolve }))
      const { activities, loaded, fetchActivities } = useActivities()

      // Act
      const pending = fetchActivities()
      await vi.waitFor(() => expect(loaded.value).toBe(true))

      // Assert
      expect(activities.value).toEqual(snapshot)
      answer(fresh)
      await pending
    })

    it('should replace the snapshot with the server data and save it for this user', async () => {
      // Arrange
      vi.mocked(loadActivities).mockResolvedValue(snapshot)
      vi.mocked(api).mockResolvedValueOnce(fresh)
      const { activities, fetchActivities } = useActivities()

      // Act
      await fetchActivities()

      // Assert
      expect(activities.value).toEqual(fresh)
      expect(saveActivities).toHaveBeenCalledWith('user-1', fresh)
    })

    it('should keep showing the snapshot without an error when offline', async () => {
      // Arrange
      vi.mocked(loadActivities).mockResolvedValue(snapshot)
      vi.mocked(api).mockRejectedValueOnce(new NetworkError(new TypeError('Failed to fetch')))
      const { activities, error, loaded, fetchActivities } = useActivities()

      // Act
      await fetchActivities()

      // Assert
      expect(activities.value).toEqual(snapshot)
      expect(loaded.value).toBe(true)
      expect(error.value).toBe(false)
    })

    it('should flag an error when offline with no snapshot', async () => {
      // Arrange
      vi.mocked(api).mockRejectedValueOnce(new NetworkError(new TypeError('Failed to fetch')))
      const { loaded, error, fetchActivities } = useActivities()

      // Act
      await fetchActivities()

      // Assert
      expect(loaded.value).toBe(false)
      expect(error.value).toBe(true)
    })

    it('should bump the local counter of an accepted or skipped activity and persist it', async () => {
      // Arrange
      const counted = [
        { id: 'a1', times_accepted: 2, times_skipped: 0 },
        { id: 'a2', times_accepted: 0, times_skipped: 1 },
      ] as Activity[]
      vi.mocked(api).mockResolvedValueOnce(counted)
      const { activities, fetchActivities, recordLocalEvent } = useActivities()
      await fetchActivities()

      // Act
      recordLocalEvent('a1', 'accepted')
      recordLocalEvent('a2', 'skipped')

      // Assert
      expect(activities.value.map((activity) => [activity.times_accepted, activity.times_skipped]))
        .toEqual([[3, 0], [0, 2]])
      expect(saveActivities).toHaveBeenLastCalledWith('user-1', activities.value)
    })

    it('should not read or write a snapshot without a signed-in user', async () => {
      // Arrange
      vi.mocked(useAuth).mockReturnValue({ user: ref(null) } as unknown as ReturnType<typeof useAuth>)
      vi.mocked(api).mockResolvedValueOnce(fresh)
      const { fetchActivities } = useActivities()

      // Act
      await fetchActivities()

      // Assert
      expect(loadActivities).not.toHaveBeenCalled()
      expect(saveActivities).not.toHaveBeenCalled()
    })

    it('should still succeed when saving the snapshot fails', async () => {
      // Arrange
      vi.mocked(saveActivities).mockRejectedValue(new Error('QuotaExceededError'))
      vi.mocked(api).mockResolvedValueOnce(fresh)
      const { activities, error, fetchActivities } = useActivities()

      // Act
      await fetchActivities()

      // Assert
      expect(activities.value).toEqual(fresh)
      expect(error.value).toBe(false)
    })

    it('should let a NetworkError from a failed create reach the caller', async () => {
      // Arrange
      const offline = new NetworkError(new TypeError('Failed to fetch'))
      vi.mocked(api).mockRejectedValueOnce(offline)
      const { createActivity } = useActivities()

      // Act + Assert
      await expect(
        createActivity({ title: 'x', description: null, suggested_duration: 5, min_stress_level: 1, max_stress_level: 5, category_ids: [] }),
      ).rejects.toBe(offline)
    })
  })
})
