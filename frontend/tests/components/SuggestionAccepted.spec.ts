import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { computed, ref } from 'vue'
import SuggestionAccepted from '../../src/components/SuggestionAccepted.vue'
import { usePostActivityFeedback } from '../../src/composables/usePostActivityFeedback'

vi.mock('../../src/composables/usePostActivityFeedback')

function mockFeedback(overrides: Partial<ReturnType<typeof usePostActivityFeedback>> = {}) {
  const mocked = {
    target: ref(null),
    canFinish: ref(false),
    trackAccepted: vi.fn(),
    openForLastAccepted: vi.fn(),
    checkPending: vi.fn(),
    answer: vi.fn(),
    dismiss: vi.fn(),
    ...overrides,
  } as ReturnType<typeof usePostActivityFeedback>
  vi.mocked(usePostActivityFeedback).mockReturnValue(mocked)
  return mocked
}

describe('SuggestionAccepted', () => {
  it('should show the accepted confirmation message', () => {
    // Arrange
    mockFeedback()

    // Act
    const wrapper = shallowMount(SuggestionAccepted)

    // Assert
    expect(wrapper.text()).toContain('suggest.accepted')
  })

  it('should let the parent handle going back', async () => {
    // Arrange
    mockFeedback()
    const wrapper = shallowMount(SuggestionAccepted)

    // Act
    await wrapper.find('button').trigger('click')

    // Assert
    expect(wrapper.emitted('back')).toHaveLength(1)
  })

  it('should let the user say they are done so the feedback question opens right away', async () => {
    // Arrange
    const feedback = mockFeedback({ canFinish: computed(() => true) })
    const wrapper = shallowMount(SuggestionAccepted)

    // Act
    await wrapper.find('[data-test="done"]').trigger('click')

    // Assert
    expect(feedback.openForLastAccepted).toHaveBeenCalledOnce()
  })

  it('should not offer "klaar" when there is no accepted activity to ask about', () => {
    // Arrange
    mockFeedback({ canFinish: computed(() => false) })

    // Act
    const wrapper = shallowMount(SuggestionAccepted)

    // Assert
    expect(wrapper.find('[data-test="done"]').exists()).toBe(false)
  })
})
