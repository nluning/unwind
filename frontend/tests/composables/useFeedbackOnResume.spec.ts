import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useFeedbackOnResume } from '../../src/composables/useFeedbackOnResume'
import { usePostActivityFeedback } from '../../src/composables/usePostActivityFeedback'

vi.mock('../../src/composables/usePostActivityFeedback')

function mountWith(isEligible: () => boolean) {
  const checkPending = vi.fn()
  vi.mocked(usePostActivityFeedback).mockReturnValue({
    checkPending,
  } as unknown as ReturnType<typeof usePostActivityFeedback>)
  const Host = defineComponent({
    setup() {
      useFeedbackOnResume(isEligible)
      return () => h('div')
    },
  })
  const wrapper = mount(Host)
  return { wrapper, checkPending }
}

describe('useFeedbackOnResume', () => {
  it('should check when the user comes back to the app', () => {
    // Arrange
    const { wrapper, checkPending } = mountWith(() => true)
    checkPending.mockClear()

    // Act
    document.dispatchEvent(new Event('visibilitychange'))

    // Assert
    expect(checkPending).toHaveBeenCalledOnce()
    wrapper.unmount()
  })

  it('should check once at startup as soon as the user is eligible', () => {
    // Arrange & Act
    const { wrapper, checkPending } = mountWith(() => true)

    // Assert
    expect(checkPending).toHaveBeenCalledOnce()
    wrapper.unmount()
  })

  it('should not check on pages where the question must not appear', () => {
    // Arrange
    const { wrapper, checkPending } = mountWith(() => false)

    // Act
    window.dispatchEvent(new Event('focus'))
    window.dispatchEvent(new Event('pageshow'))

    // Assert
    expect(checkPending).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('should check when the user becomes eligible after the session is ready', async () => {
    // Arrange
    const eligible = ref(false)
    const { wrapper, checkPending } = mountWith(() => eligible.value)

    // Act
    eligible.value = true
    await wrapper.vm.$nextTick()

    // Assert
    expect(checkPending).toHaveBeenCalledOnce()
    wrapper.unmount()
  })

  it('should stop listening once the app is torn down', () => {
    // Arrange
    const { wrapper, checkPending } = mountWith(() => true)
    checkPending.mockClear()
    wrapper.unmount()

    // Act
    document.dispatchEvent(new Event('visibilitychange'))

    // Assert
    expect(checkPending).not.toHaveBeenCalled()
  })
})
