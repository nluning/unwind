import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import OnboardingStepHeader from '../../src/components/OnboardingStepHeader.vue'

// The "question N of total" counter is the only logic here (param passing + the
// total default), and the global $t passthrough (tests/setup.ts) swallows the
// params. So this spec builds a real translator over a controlled message and
// passes it as the $t mock — overriding the passthrough for this mount only —
// so vue-i18n's interpolation actually runs and proves n/total flow through.
const i18n = createI18n({
  legacy: false,
  locale: 'nl',
  messages: { nl: { onboarding: { questionOf: 'Vraag {n} van {total}' } } },
})
const translate = (key: string, named: Record<string, unknown>) => i18n.global.t(key, named)

describe('OnboardingStepHeader', () => {
  it('should show the question counter, defaulting the total, alongside the title', () => {
    // Arrange & Act — no `total` prop, so the default of 5 should apply
    const wrapper = shallowMount(OnboardingStepHeader, {
      props: { questionNumber: 1, title: 'Waar ben je nu?' },
      global: { mocks: { $t: translate } },
    })

    // Assert
    expect(wrapper.text()).toContain('Vraag 1 van 5')
    expect(wrapper.text()).toContain('Waar ben je nu?')
  })

  it('should show a hint when the hint slot is provided', () => {
    // Arrange & Act
    const wrapper = shallowMount(OnboardingStepHeader, {
      props: { questionNumber: 1, title: 'Waar ben je nu?' },
      slots: { hint: 'Kies er meerdere' },
    })

    // Assert
    expect(wrapper.find('[data-test="hint"]').text()).toBe('Kies er meerdere')
  })

  it('should omit the hint element when no hint slot is given', () => {
    // Arrange & Act
    const wrapper = shallowMount(OnboardingStepHeader, {
      props: { questionNumber: 1, title: 'Waar ben je nu?' },
    })

    // Assert
    expect(wrapper.find('[data-test="hint"]').exists()).toBe(false)
  })
})
