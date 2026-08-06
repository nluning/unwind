import { vi } from 'vitest'
import type { Activity } from '../../types/activity'
import type { useActivityTranslation as Real } from '../useActivityTranslation'

// Default passthrough: render the activity's own title/description. Override
// per test with makeUseActivityTranslationMock({ ... }) when a spec needs to.
export function makeUseActivityTranslationMock(
  overrides: Partial<ReturnType<typeof Real>> = {},
): ReturnType<typeof Real> {
  return {
    titleFor: (activity: Activity) => activity.title,
    descriptionFor: (activity: Activity) => activity.description,
    ...overrides,
  }
}

export const useActivityTranslation = vi.fn(makeUseActivityTranslationMock)
