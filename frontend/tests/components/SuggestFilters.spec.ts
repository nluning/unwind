import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import SuggestFilters from '../../src/components/SuggestFilters.vue'

describe('SuggestFilters', () => {
  it('should open the filter panel on trigger click', async () => {
    // Arrange
    const wrapper = shallowMount(SuggestFilters)

    // Act
    await wrapper.get('[aria-expanded]').trigger('click')

    // Assert
    expect(wrapper.get('[aria-expanded]').attributes('aria-expanded')).toBe('true')
    expect(wrapper.findComponent({ name: 'StressLevelPicker' }).exists()).toBe(true)
  })

  it('should close and return focus to the trigger on Escape', async () => {
    // Arrange
    const wrapper = shallowMount(SuggestFilters, { attachTo: document.body })
    await wrapper.get('[aria-expanded]').trigger('click')

    // Act
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()

    // Assert
    expect(wrapper.get('[aria-expanded]').attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(wrapper.get('[aria-expanded]').element)

    wrapper.unmount()
  })
})
