// @vitest-environment jsdom — useSuggestionFlow transitively imports the router (via useActivities).
import { describe, it, expect, beforeEach } from 'vitest'
import { ref, computed, nextTick } from 'vue'
import { useSuggestionFlow, resetSuggestionFlowState } from './useSuggestionFlow.js'
import type { Activity } from '../types/activity.js'

function makeActivity(id: string): Activity {
  return {
    id,
    title: id,
    description: null,
    suggested_duration: 10,
    min_stress_level: 1,
    max_stress_level: 5,
    source: 'user',
    times_accepted: 0,
    times_skipped: 0,
    categories: [],
  }
}

describe('useSuggestionFlow', () => {
  beforeEach(() => {
    resetSuggestionFlowState()
  })

  it('should keep the current suggestion when the activity list grows (e.g. after adding one)', async () => {
    // Arrange
    const source = ref<Activity[]>([makeActivity('a')])
    const pool = computed(() => source.value)
    const { current } = useSuggestionFlow({ mode: 'mode1', pool })

    // Act — adding an activity grows the pool but shouldn't bump the suggestion.
    source.value = [makeActivity('a'), makeActivity('b')]
    await nextTick()

    // Assert
    expect(current.value?.id).toBe('a')
  })

  it('should pick a fresh suggestion when the current one leaves the pool', async () => {
    // Arrange
    const source = ref<Activity[]>([makeActivity('a')])
    const pool = computed(() => source.value)
    const { current } = useSuggestionFlow({ mode: 'mode1', pool })

    // Act — 'a' is removed (deleted / filtered out), only 'b' remains.
    source.value = [makeActivity('b')]
    await nextTick()

    // Assert
    expect(current.value?.id).toBe('b')
  })
})
