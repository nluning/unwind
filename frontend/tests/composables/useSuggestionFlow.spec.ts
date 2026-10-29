import { describe, it, expect, vi } from 'vitest'
import { ref, computed, nextTick } from 'vue'
import { api } from '../../src/api/client'
import { useActivities } from '../../src/composables/useActivities'
import { makeUseActivitiesMock } from '../../src/composables/__mocks__/useActivities'
import {
  useSuggestionFlow,
  resetSuggestionFlowState,
} from '../../src/composables/useSuggestionFlow'
import {
  usePostActivityFeedback,
  resetPostActivityFeedback,
} from '../../src/composables/usePostActivityFeedback'
import type { Activity } from '../../src/types/activity'

vi.mock('../../src/composables/useActivities')

describe('useSuggestionFlow', () => {
  it('should keep the current suggestion when the pool grows (e.g. after adding one)', async () => {
    // Arrange — first pick is what's shown; any re-pick would return a different
    // activity, so a bumped suggestion would surface as 'replacement'.
    resetSuggestionFlowState()
    const suggest = vi
      .fn()
      .mockReturnValueOnce({ id: 'shown' })
      .mockReturnValue({ id: 'replacement' })
    vi.mocked(useActivities).mockReturnValue(makeUseActivitiesMock({ suggest }))
    const source = ref<Activity[]>([
      // @ts-expect-error partial test activity — the flow only reads id
      { id: 'shown' },
    ])
    const pool = computed(() => source.value)
    const { current } = useSuggestionFlow({ mode: 'mode1', pool })

    // Act — growing the pool must not bump the suggestion the user is looking at.
    source.value = [
      // @ts-expect-error partial test activity
      { id: 'shown' },
      // @ts-expect-error partial test activity
      { id: 'replacement' },
    ]
    await nextTick()

    // Assert
    expect(current.value?.id).toBe('shown')
  })

  it('should pick a fresh suggestion when the current one leaves the pool', async () => {
    // Arrange
    resetSuggestionFlowState()
    const suggest = vi
      .fn()
      .mockReturnValueOnce({ id: 'removed' })
      .mockReturnValue({ id: 'remaining' })
    vi.mocked(useActivities).mockReturnValue(makeUseActivitiesMock({ suggest }))
    const source = ref<Activity[]>([
      // @ts-expect-error partial test activity — the flow only reads id
      { id: 'removed' },
    ])
    const pool = computed(() => source.value)
    const { current } = useSuggestionFlow({ mode: 'mode1', pool })

    // Act — 'removed' is deleted / filtered out, only 'remaining' is left.
    source.value = [
      // @ts-expect-error partial test activity
      { id: 'remaining' },
    ]
    await nextTick()

    // Assert
    expect(current.value?.id).toBe('remaining')
  })

  it('should show the confirmation and stop offering a suggestion once accepted', () => {
    // Arrange
    resetSuggestionFlowState()
    vi.mocked(api).mockResolvedValueOnce({ id: 'event-1' })
    const suggest = vi.fn().mockReturnValue({ id: 'picked' })
    vi.mocked(useActivities).mockReturnValue(makeUseActivitiesMock({ suggest }))
    const activities: Activity[] = [
      // @ts-expect-error partial test activity — the flow only reads id
      { id: 'picked' },
    ]
    const pool = computed(() => activities)
    const { current, accepted, handleAccept } = useSuggestionFlow({ mode: 'mode2', pool })

    // Act
    handleAccept()

    // Assert
    expect(accepted.value).toBe(true)
    expect(current.value).toBeNull()
  })

  it('should record an accepted activity as a usage event', () => {
    // Arrange
    resetSuggestionFlowState()
    vi.mocked(api).mockResolvedValueOnce({ id: 'event-1' })
    const suggest = vi.fn().mockReturnValue({ id: 'picked' })
    vi.mocked(useActivities).mockReturnValue(makeUseActivitiesMock({ suggest }))
    const activities: Activity[] = [
      // @ts-expect-error partial test activity — the flow only reads id
      { id: 'picked' },
    ]
    const pool = computed(() => activities)
    const { handleAccept } = useSuggestionFlow({ mode: 'mode2', pool })

    // Act
    handleAccept()

    // Assert
    expect(vi.mocked(api)).toHaveBeenCalledWith('/usage-events', {
      method: 'POST',
      body: JSON.stringify({ activity_id: 'picked', action: 'accepted', mode: 'mode2' }),
    })
  })

  it('should let the user say they are done with the activity they just accepted', async () => {
    // Arrange
    resetSuggestionFlowState()
    resetPostActivityFeedback()
    vi.mocked(api).mockResolvedValueOnce({ id: 'event-1' })
    const suggest = vi.fn().mockReturnValue({ id: 'picked', title: 'Walk', source: 'base' })
    vi.mocked(useActivities).mockReturnValue(makeUseActivitiesMock({ suggest }))
    const activities: Activity[] = [
      // @ts-expect-error partial test activity — the flow only reads id
      { id: 'picked' },
    ]
    const pool = computed(() => activities)
    const { handleAccept } = useSuggestionFlow({ mode: 'mode2', pool })
    const { target, openForLastAccepted } = usePostActivityFeedback()
    handleAccept()

    // Act
    await openForLastAccepted()

    // Assert
    expect(target.value).toEqual({
      eventId: 'event-1',
      activity: { id: 'picked', title: 'Walk', source: 'base' },
    })
  })

  it('should move on to the next suggestion once the feedback question has been answered', async () => {
    // Arrange
    resetSuggestionFlowState()
    resetPostActivityFeedback()
    vi.mocked(api).mockResolvedValueOnce({ id: 'event-1' }) // accept
    vi.mocked(api).mockResolvedValueOnce({ ok: true }) // answer
    const suggest = vi
      .fn()
      .mockReturnValueOnce({ id: 'picked', title: 'Walk', source: 'base' })
      .mockReturnValue({ id: 'next-up' })
    vi.mocked(useActivities).mockReturnValue(makeUseActivitiesMock({ suggest }))
    const activities: Activity[] = [
      // @ts-expect-error partial test activity — the flow only reads id
      { id: 'picked' },
    ]
    const pool = computed(() => activities)
    // mode4 is unused elsewhere in this file: instances created in earlier tests
    // are never unmounted, so their watchers would also react to this answer.
    const { current, accepted, handleAccept } = useSuggestionFlow({ mode: 'mode4', pool })
    const { openForLastAccepted, answer } = usePostActivityFeedback()
    handleAccept()
    await openForLastAccepted()

    // Act
    answer('better')
    await nextTick()

    // Assert — the 'tot zo' confirmation is gone and a fresh suggestion is shown
    expect(accepted.value).toBe(false)
    expect(current.value?.id).toBe('next-up')
  })

  it('should record a skipped activity as a usage event', () => {
    // Arrange
    resetSuggestionFlowState()
    const suggest = vi.fn().mockReturnValue({ id: 'picked' })
    vi.mocked(useActivities).mockReturnValue(makeUseActivitiesMock({ suggest }))
    const activities: Activity[] = [
      // @ts-expect-error partial test activity — the flow only reads id
      { id: 'picked' },
    ]
    const pool = computed(() => activities)
    const { handleSkip } = useSuggestionFlow({ mode: 'mode3', pool })

    // Act
    handleSkip()

    // Assert
    expect(vi.mocked(api)).toHaveBeenCalledWith('/usage-events', {
      method: 'POST',
      body: JSON.stringify({ activity_id: 'picked', action: 'skipped', mode: 'mode3' }),
    })
  })
})
