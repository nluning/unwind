import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import PageHeader from '../../src/components/PageHeader.vue'

describe('PageHeader', () => {
  it('should let the parent handle going back when the back button is shown', async () => {
    // Arrange
    const wrapper = shallowMount(PageHeader, {
      props: { back: true },
    })

    // Act
    await wrapper.find('button').trigger('click')

    // Assert
    expect(wrapper.emitted('back')).toHaveLength(1)
  })

  it('should omit the back button on spoke pages', () => {
    // Arrange & Act
    const wrapper = shallowMount(PageHeader, {
      props: { back: false },
    })

    // Assert
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('should show the wordmark only when requested', () => {
    // Arrange & Act
    const wrapper = shallowMount(PageHeader, {
      props: { wordmark: true },
    })

    // Assert
    expect(wrapper.text()).toContain('unwind')
  })
})
