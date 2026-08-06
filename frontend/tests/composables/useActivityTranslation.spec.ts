import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { createI18n } from 'vue-i18n'
import { useActivityTranslation } from '../../src/composables/useActivityTranslation'
import type { Activity } from '../../src/types/activity'

// useActivityTranslation calls useI18n(), which needs a live Vue + i18n
// context — so we run it inside a throwaway host component. The messages are a
// small controlled set (not the real nl.json) so the test verifies the lookup
// logic, not translation copy. 'avondwandeling' is slugify('Avondwandeling').
function withActivityTranslation() {
  const i18n = createI18n({
    legacy: false,
    locale: 'nl',
    fallbackLocale: 'nl',
    messages: {
      nl: {
        activities: {
          avondwandeling: {
            title: 'Maak een avondwandeling',
            description: 'Loop een rustig rondje buiten.',
          },
        },
      },
    },
  })

  let translation!: ReturnType<typeof useActivityTranslation>
  mount(
    defineComponent({
      setup() {
        translation = useActivityTranslation()
        return () => null
      },
    }),
    { global: { plugins: [i18n] } },
  )
  return translation
}

const baseActivity: Activity = {
  id: '1',
  title: 'Avondwandeling',
  description: 'Original description',
  suggested_duration: 15,
  min_stress_level: 1,
  max_stress_level: 5,
  source: 'base',
  times_accepted: 0,
  times_skipped: 0,
  categories: [],
}

describe('useActivityTranslation', () => {
  it('should translate a base activity via its slugged key', () => {
    // Arrange
    const { titleFor } = withActivityTranslation()

    // Act
    const title = titleFor(baseActivity)

    // Assert
    expect(title).toBe('Maak een avondwandeling')
  })

  it('should return a non-base activity title untranslated', () => {
    // Arrange
    const { titleFor } = withActivityTranslation()

    // Act — same title as the base case, but source 'user' skips the lookup
    const title = titleFor({ ...baseActivity, source: 'user' })

    // Assert
    expect(title).toBe('Avondwandeling')
  })

  it('should fall back to the raw title when no translation exists', () => {
    // Arrange
    const { titleFor } = withActivityTranslation()

    // Act
    const title = titleFor({ ...baseActivity, title: 'Iets onbekends' })

    // Assert
    expect(title).toBe('Iets onbekends')
  })

  it('should return null when the activity has no description', () => {
    // Arrange
    const { descriptionFor } = withActivityTranslation()

    // Act
    const description = descriptionFor({ ...baseActivity, description: null })

    // Assert
    expect(description).toBeNull()
  })
})
