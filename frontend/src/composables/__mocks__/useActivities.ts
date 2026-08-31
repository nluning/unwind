import { ref, computed } from 'vue'
import { vi } from 'vitest'
import type { Activity } from '../../types/activity'
import type { useActivities as Real } from '../useActivities'

// Re-export the runtime constant so a bare `vi.mock('../useActivities')` doesn't
// leave pages that import CATEGORY_ID_MAP (ActivityFormPage) with undefined.
export { CATEGORY_ID_MAP } from '../../types/activity'

// Default mock: a loaded, non-empty-agnostic activities store whose methods are
// spies. Override any field per test via makeUseActivitiesMock({ ... }). Typed
// against the real return so vue-tsc fails the moment the real shape drifts.
export function makeUseActivitiesMock(
  overrides: Partial<ReturnType<typeof Real>> = {},
): ReturnType<typeof Real> {
  return {
    activities: ref<Activity[]>([]),
    loaded: ref(true),
    error: ref(false),
    isEmpty: computed(() => false),
    fetchActivities: vi.fn(),
    createActivity: vi.fn(),
    updateActivity: vi.fn(),
    deleteActivity: vi.fn(),
    filterByStress: vi.fn(() => []),
    filterByExcludedCategories: vi.fn(() => []),
    filterByIncludedCategories: vi.fn(() => []),
    suggest: vi.fn(() => null),
    markAccepted: vi.fn(),
    resetSession: vi.fn(),
    ...overrides,
  }
}

export const useActivities = vi.fn(makeUseActivitiesMock)

// Named export used on logout; harmless no-op in tests.
export const resetActivitiesState = vi.fn()
