import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import TextField from '../../src/components/TextField.vue'

describe('TextField', () => {
  describe('TextField', () => {
    it('should show its label', () => {
      // Arrange & Act
      const wrapper = shallowMount(TextField, {
        props: { label: 'Naam', modelValue: '' },
      })

      // Assert
      expect(wrapper.text()).toContain('Naam')
    })

    it('should emit the typed value via update:modelValue', async () => {
      // Arrange
      const wrapper = shallowMount(TextField, {
        props: { label: 'Naam', modelValue: '' },
      })

      // Act
      const input = wrapper.find('input')
      input.element.value = 'Noor'
      await input.trigger('input')

      // Assert
      expect(wrapper.emitted('update:modelValue')).toEqual([['Noor']])
    })

    it('should render a textarea instead of an input when multiline', () => {
      // Arrange & Act
      const wrapper = shallowMount(TextField, {
        props: { label: 'Bio', modelValue: '', multiline: true },
      })

      // Assert
      expect(wrapper.find('textarea').exists()).toBe(true)
      expect(wrapper.find('input').exists()).toBe(false)
    })
  })
})
