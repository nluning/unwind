import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import WelcomeCard from '../../src/components/WelcomeCard.vue'

describe('WelcomeCard', () => {
  describe('WelcomeCard', () => {
    it('should show the welcome heading and body', () => {
      // Arrange & Act
      const wrapper = shallowMount(WelcomeCard)

      // Assert
      expect(wrapper.text()).toContain('welcome.heading')
      expect(wrapper.text()).toContain('welcome.body')
    })

    it('should let the parent handle dismissing the card', async () => {
      // Arrange
      const wrapper = shallowMount(WelcomeCard)

      // Act
      await wrapper.find('button').trigger('click')

      // Assert
      expect(wrapper.emitted('dismiss')).toHaveLength(1)
    })
  })
})
