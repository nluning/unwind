import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import StateMessage from '../../src/components/StateMessage.vue'

describe('StateMessage', () => {
  describe('StateMessage', () => {
    it('should render the message passed via the default slot', () => {
      // Arrange & Act
      const wrapper = shallowMount(StateMessage, {
        slots: { default: 'Geen activiteiten gevonden' },
      })

      // Assert
      expect(wrapper.text()).toContain('Geen activiteiten gevonden')
    })

    it('should render content passed via the action slot', () => {
      // Arrange & Act
      const wrapper = shallowMount(StateMessage, {
        slots: {
          default: 'Geen activiteiten gevonden',
          action: '<a href="/new">Toevoegen</a>',
        },
      })

      // Assert
      expect(wrapper.find('a').text()).toBe('Toevoegen')
    })
  })
})
