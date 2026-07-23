import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import OnboardingStepActions from '../../src/components/OnboardingStepActions.vue'

describe('OnboardingStepActions', () => {
  it('should let the parent handle going back', async () => {
    // Arrange
    const wrapper = shallowMount(OnboardingStepActions, {
      props: { showContinue: true },
    })

    // Act
    await wrapper.find('[data-test="back"]').trigger('click')

    // Assert
    expect(wrapper.emitted('back')).toHaveLength(1)
  })

  it('should let the parent handle continuing', async () => {
    // Arrange
    const wrapper = shallowMount(OnboardingStepActions, {
      props: { showContinue: true },
    })

    // Act
    await wrapper.find('[data-test="continue"]').trigger('click')

    // Assert
    expect(wrapper.emitted('continue')).toHaveLength(1)
  })

  it('should hide the continue button until the step is complete', () => {
    // Arrange & Act
    const wrapper = shallowMount(OnboardingStepActions, {
      props: { showContinue: false },
    })

    // Assert
    expect(wrapper.find('[data-test="continue"]').exists()).toBe(false)
  })
})
