import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import TextButton from '../../src/components/TextButton.vue'

describe('TextButton', () => {
  describe('TextButton', () => {
    it('should render its slotted label inside a button', () => {
      // Arrange & Act
      const wrapper = shallowMount(TextButton, {
        slots: { default: 'Opnieuw' },
      })

      // Assert
      expect(wrapper.find('button').text()).toBe('Opnieuw')
    })
  })
})
