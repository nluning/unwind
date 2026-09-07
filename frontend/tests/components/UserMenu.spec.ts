import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import UserMenu from '../../src/components/UserMenu.vue'

describe('UserMenu', () => {
  it('should open the menu on trigger click', async () => {
    // Arrange
    const wrapper = shallowMount(UserMenu)

    // Act
    await wrapper.get('[aria-expanded]').trigger('click')

    // Assert
    expect(wrapper.get('[aria-expanded]').attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('nav').exists()).toBe(true)
  })

  it('should close and return focus to the trigger on Escape', async () => {
    // Arrange
    const wrapper = shallowMount(UserMenu, { attachTo: document.body })
    await wrapper.get('[aria-expanded]').trigger('click')

    // Act
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()

    // Assert
    expect(wrapper.find('nav').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.get('[aria-expanded]').element)

    wrapper.unmount()
  })
})
