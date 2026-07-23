import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import SuggestionAccepted from '../../src/components/SuggestionAccepted.vue'

describe('SuggestionAccepted', () => {
  it('should show the accepted confirmation message', () => {
    // Arrange & Act
    const wrapper = shallowMount(SuggestionAccepted)

    // Assert
    expect(wrapper.text()).toContain('suggest.accepted')
  })

  it('should let the parent handle going back', async () => {
    // Arrange
    const wrapper = shallowMount(SuggestionAccepted)

    // Act
    await wrapper.find('button').trigger('click')

    // Assert
    expect(wrapper.emitted('back')).toHaveLength(1)
  })
})
