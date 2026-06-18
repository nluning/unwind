import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import OnboardingOptionPills from '../../src/components/OnboardingOptionPills.vue'

// shallowMount stubs the pill child, so we drive it through the contract this
// component depends on — `selected` in, `click` out — located via the
// [data-test="pill"] hook rather than by importing the child. The pills emit
// `click` as a component event, so a native .trigger('click') on the stub
// wouldn't reach the handler; .vm.$emit('click') fires the real listener.
const options = [
  { value: 'home', label: 'Thuis' },
  { value: 'outside', label: 'Buiten' },
]

describe('OnboardingOptionPills', () => {
  describe('OnboardingOptionPills', () => {
    it('should render a labelled pill for each option', () => {
      // Arrange & Act — renderStubDefaultSlot makes the stubbed pills render the
      // slotted label so we can assert it without un-stubbing the child.
      const wrapper = shallowMount(OnboardingOptionPills, {
        props: { options, modelValue: '' },
        global: { renderStubDefaultSlot: true },
      })

      // Assert
      const pills = wrapper.findAllComponents('[data-test="pill"]')
      expect(pills).toHaveLength(2)
      expect(pills[0].text()).toBe('Thuis')
      expect(pills[1].text()).toBe('Buiten')
    })

    it('should mark the pill matching the current value as selected', () => {
      // Arrange & Act
      const wrapper = shallowMount(OnboardingOptionPills, {
        props: { options, modelValue: 'outside' },
      })

      // Assert
      const pills = wrapper.findAllComponents('[data-test="pill"]')
      expect(pills[0].props('selected')).toBe(false)
      expect(pills[1].props('selected')).toBe(true)
    })

    it('should emit the tapped option value via update:modelValue', () => {
      // Arrange
      const wrapper = shallowMount(OnboardingOptionPills, {
        props: { options, modelValue: '' },
      })

      // Act
      wrapper.findAllComponents('[data-test="pill"]')[1].vm.$emit('click')

      // Assert
      expect(wrapper.emitted('update:modelValue')).toEqual([['outside']])
    })
  })
})
