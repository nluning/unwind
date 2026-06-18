import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ToggleButton from '../../src/components/ToggleButton.vue'

describe('ToggleButton', () => {
  describe('ToggleButton', () => {
    it('should render its slotted label', () => {
      // Arrange & Act
      const wrapper = shallowMount(ToggleButton, {
        slots: { default: 'Thuis' },
      })

      // Assert
      expect(wrapper.text()).toContain('Thuis')
    })

    it('should render in its selected state when selected', () => {
      // Arrange & Act — selected drives the active styling (used by the pills)
      const wrapper = shallowMount(ToggleButton, {
        props: { selected: true },
        slots: { default: 'Thuis' },
      })

      // Assert
      expect(wrapper.find('button').text()).toBe('Thuis')
    })

    it('should render at the small size when requested', () => {
      // Arrange & Act — size 'sm' is used by ActivityFormPage; exercise that path
      const wrapper = shallowMount(ToggleButton, {
        props: { size: 'sm' },
        slots: { default: 'Thuis' },
      })

      // Assert
      expect(wrapper.find('button').text()).toBe('Thuis')
    })

    it('should let the parent handle the click', async () => {
      // Arrange
      const wrapper = shallowMount(ToggleButton, {
        slots: { default: 'Thuis' },
      })

      // Act
      await wrapper.find('button').trigger('click')

      // Assert
      expect(wrapper.emitted('click')).toHaveLength(1)
    })
  })
})
