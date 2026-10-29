import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { ref } from 'vue'
import App from '../src/App.vue'
import FeedbackInterstitial from '../src/components/FeedbackInterstitial.vue'
import { useAuth } from '../src/composables/useAuth'
import { useWelcome } from '../src/composables/useWelcome'
import { usePostActivityFeedback } from '../src/composables/usePostActivityFeedback'

const { push, route } = vi.hoisted(() => ({
  push: vi.fn(),
  route: { name: 'activities', meta: {} as Record<string, unknown> },
}))

vi.mock('vue-router', () => ({
  RouterView: { render: () => null },
  useRoute: () => route,
  useRouter: () => ({ push }),
}))
vi.mock('../src/composables/useAuth')
vi.mock('../src/composables/useWelcome')
vi.mock('../src/composables/usePostActivityFeedback')
vi.mock('../src/composables/useFeedbackOnResume')

function mountApp(routeName: string) {
  route.name = routeName
  push.mockClear()
  vi.mocked(useAuth).mockReturnValue({ user: ref({ id: 'u1' }) } as unknown as ReturnType<typeof useAuth>)
  vi.mocked(useWelcome).mockReturnValue({
    isWelcomed: ref(true),
    showMenuHint: ref(false),
  } as unknown as ReturnType<typeof useWelcome>)
  const feedback = {
    target: ref({ eventId: 'event-1', activity: { id: 'a1', title: 'Walk', source: 'user' } }),
    answer: vi.fn(),
    dismiss: vi.fn(),
  }
  vi.mocked(usePostActivityFeedback).mockReturnValue(
    feedback as unknown as ReturnType<typeof usePostActivityFeedback>,
  )
  return { wrapper: shallowMount(App), feedback }
}

describe('App', () => {
  it('should take the user back to the suggest page after they answer the question', () => {
    // Arrange
    const { wrapper, feedback } = mountApp('activities')

    // Act
    wrapper.findComponent(FeedbackInterstitial).vm.$emit('answer', 'better')

    // Assert
    expect(feedback.answer).toHaveBeenCalledWith('better')
    expect(push).toHaveBeenCalledWith({ name: 'suggest' })
  })

  it('should stay put when the user answers while already on the suggest page', () => {
    // Arrange
    const { wrapper } = mountApp('suggest')

    // Act
    wrapper.findComponent(FeedbackInterstitial).vm.$emit('answer', 'same')

    // Assert
    expect(push).not.toHaveBeenCalled()
  })

  it('should leave the user where they are when they skip the question', () => {
    // Arrange
    const { wrapper, feedback } = mountApp('activities')

    // Act
    wrapper.findComponent(FeedbackInterstitial).vm.$emit('dismiss')

    // Assert
    expect(feedback.dismiss).toHaveBeenCalledOnce()
    expect(push).not.toHaveBeenCalled()
  })
})
