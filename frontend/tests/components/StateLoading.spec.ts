import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import StateLoading from '../../src/components/StateLoading.vue'

describe('StateLoading', () => {
  it('should show the default loading message', () => {
    // Arrange & Act
    const wrapper = shallowMount(StateLoading)

    // Assert
    expect(wrapper.text()).toContain('suggest.loading')
  })

  it('should render a custom message via the default slot', () => {
    // Arrange & Act
    const wrapper = shallowMount(StateLoading, {
      slots: { default: 'Bezig met laden' },
    })

    // Assert
    expect(wrapper.text()).toContain('Bezig met laden')
  })
})
