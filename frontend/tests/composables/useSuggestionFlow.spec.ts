import { describe, it, expect, vi } from 'vitest'
import { ref, computed, nextTick } from 'vue'
import { api } from '../../src/api/client'
import { useActivities } from '../../src/composables/useActivities'
import { useSuggestionFlow } from '../../src/composables/useSuggestionFlow'
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

// Helper: create a flow with pool starting empty, then populate and await watcher
async function createFlowWithPool(
  poolItems: Activity[],
  options: { mode?: 'mode1' | 'mode2' | 'mode3' | 'mode4'; extraEventData?: () => Record<string, unknown> } = {},
) {
  const { activities } = useActivities()
  activities.value = poolItems
  const source = ref<Activity[]>([])
  const pool = computed(() => source.value)
  const flow = useSuggestionFlow({
    mode: options.mode ?? 'mode1',
    pool,
    extraEventData: options.extraEventData,
  })
  // Trigger watcher by populating the pool
  source.value = poolItems
  await nextTick()
  return { ...flow, source }
}

describe('useSuggestionFlow', () => {
  it('should auto-suggest when pool changes', async () => {
    // Arrange & Act
    const { current } = await createFlowWithPool([makeActivity({ id: '1' })])

    // Assert
    expect(current.value).not.toBeNull()
    expect(current.value!.id).toBe('1')
  })

  it('should mark activity as accepted and log usage event on handleAccept', async () => {
    // Arrange
    vi.mocked(api).mockClear()
    const { current, accepted, handleAccept } = await createFlowWithPool([makeActivity({ id: '10' })])
    expect(current.value).not.toBeNull()

    // Act
    handleAccept()

    // Assert
    expect(accepted.value).toBe(true)
    expect(current.value).toBeNull()
    expect(vi.mocked(api)).toHaveBeenCalledWith('/usage-events', expect.objectContaining({
      method: 'POST',
    }))
  })

  it('should suggest next activity and log skip event on handleSkip', async () => {
    // Arrange
    vi.mocked(api).mockClear()
    const { current, handleSkip } = await createFlowWithPool([
      makeActivity({ id: '1' }),
      makeActivity({ id: '2' }),
    ])
    const firstId = current.value!.id

    // Act
    handleSkip()

    // Assert
    expect(current.value).not.toBeNull()
    const callBody = JSON.parse(
      (vi.mocked(api).mock.calls[0][1] as RequestInit).body as string,
    )
    expect(callBody.activity_id).toBe(firstId)
    expect(callBody.action).toBe('skipped')
  })

  it('should include extra event data when provided', async () => {
    // Arrange
    vi.mocked(api).mockClear()
    const { handleAccept } = await createFlowWithPool(
      [makeActivity({ id: '5' })],
      { mode: 'mode2', extraEventData: () => ({ stress_level_before: 3 }) },
    )

    // Act
    handleAccept()

    // Assert
    const callBody = JSON.parse(
      (vi.mocked(api).mock.calls[0][1] as RequestInit).body as string,
    )
    expect(callBody.stress_level_before).toBe(3)
    expect(callBody.mode).toBe('mode2')
  })

  it('should set current to null when pool becomes empty', async () => {
    // Arrange
    const { current, source } = await createFlowWithPool([makeActivity()])
    expect(current.value).not.toBeNull()

    // Act
    source.value = []
    await nextTick()

    // Assert
    expect(current.value).toBeNull()
  })
})
