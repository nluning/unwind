import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import StressLevelPicker from '../../src/components/StressLevelPicker.vue'

describe('StressLevelPicker', () => {
  it('should mark only the selected level as pressed', () => {
    // Arrange & Act
    const wrapper = shallowMount(StressLevelPicker, {
      props: { modelValue: 3 },
    })

    // Assert
    const buttons = wrapper.findAll('button')
    expect(buttons.map((button) => button.attributes('aria-pressed'))).toEqual([
      'false',
      'false',
      'true',
      'false',
      'false',
    ])
  })

  it('should emit the clicked level', async () => {
    // Arrange
    const wrapper = shallowMount(StressLevelPicker, {
      props: { modelValue: null },
    })

    // Act
    await wrapper.findAll('button')[1]?.trigger('click')

    // Assert
    expect(wrapper.emitted('update:modelValue')).toEqual([[2]])
  })
})
