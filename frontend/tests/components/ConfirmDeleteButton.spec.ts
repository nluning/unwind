import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ConfirmDeleteButton from '../../src/components/ConfirmDeleteButton.vue'

// Two-step button: the first click arms it (swaps to the confirm label) and only
// the second click emits `confirm`, so a stray tap can't delete anything.
describe('ConfirmDeleteButton', () => {
  it('should show the resting label before any click', () => {
    // Arrange & Act
    const wrapper = shallowMount(ConfirmDeleteButton, {
      props: { label: 'Verwijderen', confirmLabel: 'Zeker weten?' },
    })

    // Assert
    expect(wrapper.text()).toBe('Verwijderen')
  })

  it('should arm with the confirm label on the first click without confirming', async () => {
    // Arrange
    const wrapper = shallowMount(ConfirmDeleteButton, {
      props: { label: 'Verwijderen', confirmLabel: 'Zeker weten?' },
    })

    // Act
    await wrapper.find('button').trigger('click')

    // Assert
    expect(wrapper.text()).toBe('Zeker weten?')
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('should emit confirm on the second click', async () => {
    // Arrange
    const wrapper = shallowMount(ConfirmDeleteButton, {
      props: { label: 'Verwijderen', confirmLabel: 'Zeker weten?' },
    })

    // Act
    await wrapper.find('button').trigger('click')
    await wrapper.find('button').trigger('click')

    // Assert
    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })
})
