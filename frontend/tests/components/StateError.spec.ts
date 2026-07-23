import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import StateError from '../../src/components/StateError.vue'
import TextButton from '../../src/components/TextButton.vue'

// $t is stubbed to a passthrough in tests/setup.ts, so the default copy renders
// as its i18n key.
describe('StateError', () => {
  it('should show the default error message', () => {
    // Arrange & Act
    const wrapper = shallowMount(StateError)

    // Assert
    expect(wrapper.text()).toContain('suggest.error')
  })

  it('should render a custom message via the default slot', () => {
    // Arrange & Act
    const wrapper = shallowMount(StateError, {
      slots: { default: 'Er ging iets mis' },
    })

    // Assert
    expect(wrapper.text()).toContain('Er ging iets mis')
  })

  it('should show the default retry label', () => {
    // Arrange & Act — what all callers render: they pass no action slot, so the
    // button falls back to its default label. renderStubDefaultSlot lets the
    // stubbed TextButton render that fallback.
    const wrapper = shallowMount(StateError, {
      global: { renderStubDefaultSlot: true },
    })

    // Assert
    expect(wrapper.text()).toContain('suggest.retry')
  })

  it('should render a custom retry label via the action slot', () => {
    // Arrange & Act — the action slot lands inside the stubbed TextButton, so
    // renderStubDefaultSlot is needed for the stub to render that content.
    const wrapper = shallowMount(StateError, {
      slots: { action: 'Probeer opnieuw' },
      global: { renderStubDefaultSlot: true },
    })

    // Assert
    expect(wrapper.text()).toContain('Probeer opnieuw')
  })

  it('should let the parent handle the retry action', async () => {
    // Arrange
    const wrapper = shallowMount(StateError)

    // Act
    await wrapper.findComponent(TextButton).trigger('click')

    // Assert
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})
