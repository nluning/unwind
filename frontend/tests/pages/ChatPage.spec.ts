import { describe, it, expect, vi } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ChatPage from '../../src/pages/ChatPage.vue'
import { useChat, takeChatSeed } from '../../src/composables/useChat'
import {
  usePostActivityFeedback,
  resetPostActivityFeedback,
} from '../../src/composables/usePostActivityFeedback'
import { api } from '../../src/api/client'

vi.mock('../../src/composables/useChat')
vi.mock('../../src/composables/useActivities')
vi.mock('../../src/composables/useActivityTranslation')
vi.mock('vue-router', () => ({ useRouter: vi.fn() }))

function mockChat(overrides: Partial<ReturnType<typeof useChat>> = {}) {
  const mocked = {
    messages: ref([]),
    isStreaming: ref(false),
    error: ref(null),
    sendMessage: vi.fn(),
    resetChat: vi.fn(),
    ...overrides,
  }
  vi.mocked(useChat).mockReturnValue(mocked as unknown as ReturnType<typeof useChat>)
  return mocked
}

describe('ChatPage', () => {
  it('should announce the assistant reply once streaming finishes', async () => {
    // Arrange
    vi.mocked(useRouter).mockReturnValue({ back: vi.fn() } as unknown as ReturnType<typeof useRouter>)
    const chat = mockChat({
      messages: ref([
        { role: 'user', content: 'Hallo' },
        { role: 'assistant', content: 'Hoi! Hoe kan ik helpen?' },
      ]),
      isStreaming: ref(true),
    })
    const wrapper = shallowMount(ChatPage, { global: { renderStubDefaultSlot: true } })

    // Act — streaming completes
    chat.isStreaming.value = false
    await flushPromises()

    // Assert
    expect(wrapper.find('[role="status"]').text()).toBe('Hoi! Hoe kan ik helpen?')
  })

  it('should not announce anything while a reply is still streaming', () => {
    // Arrange
    vi.mocked(useRouter).mockReturnValue({ back: vi.fn() } as unknown as ReturnType<typeof useRouter>)
    mockChat({
      messages: ref([
        { role: 'user', content: 'Hallo' },
        { role: 'assistant', content: 'Ho' },
      ]),
      isStreaming: ref(true),
    })

    // Act
    const wrapper = shallowMount(ChatPage, { global: { renderStubDefaultSlot: true } })

    // Assert
    expect(wrapper.find('[role="status"]').text()).toBe('')
  })

  it('should offer "klaar" once the user has accepted the activity', async () => {
    // Arrange
    resetPostActivityFeedback()
    vi.mocked(useRouter).mockReturnValue({ back: vi.fn() } as unknown as ReturnType<typeof useRouter>)
    mockChat()
    // @ts-expect-error partial test activity — only the rendered fields matter
    vi.mocked(takeChatSeed).mockReturnValue({ id: 'a1', title: 'Ga wandelen', source: 'user' })
    vi.mocked(api).mockResolvedValueOnce({ id: 'event-1' })
    const wrapper = shallowMount(ChatPage, { global: { renderStubDefaultSlot: true } })

    // Act
    await wrapper.find('[data-test="accept"]').trigger('click')

    // Assert
    expect(wrapper.find('[data-test="done"]').exists()).toBe(true)
  })

  it('should ask how it went for the accepted activity when the user taps "klaar"', async () => {
    // Arrange
    resetPostActivityFeedback()
    vi.mocked(useRouter).mockReturnValue({ back: vi.fn() } as unknown as ReturnType<typeof useRouter>)
    mockChat()
    // @ts-expect-error partial test activity — only the rendered fields matter
    vi.mocked(takeChatSeed).mockReturnValue({ id: 'a1', title: 'Ga wandelen', source: 'user' })
    vi.mocked(api).mockResolvedValueOnce({ id: 'event-1' })
    const wrapper = shallowMount(ChatPage, { global: { renderStubDefaultSlot: true } })
    await wrapper.find('[data-test="accept"]').trigger('click')

    // Act
    await wrapper.find('[data-test="done"]').trigger('click')
    await flushPromises()

    // Assert
    expect(usePostActivityFeedback().target.value?.eventId).toBe('event-1')
  })
})
