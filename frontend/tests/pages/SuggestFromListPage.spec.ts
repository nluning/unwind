import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { ref } from 'vue'
import SuggestFromListPage from '../../src/pages/SuggestFromListPage.vue'
import SuggestionList from '../../src/components/SuggestionList.vue'
import StateLoading from '../../src/components/StateLoading.vue'
import StateError from '../../src/components/StateError.vue'
import { useSuggestFromList } from '../../src/composables/useSuggestFromList'
import type { AiActivity } from '../../src/utils/parseActivity'
import type { Activity } from '../../src/types/activity'

vi.mock('../../src/composables/useSuggestFromList')

const suggestions: AiActivity[] = [
  { title: 'Even wandelen', description: '', duration_minutes: 15, category: 'movement' },
] as unknown as AiActivity[]

// PageShell has no script — just a slot — so shallowMount stubs it into an
// empty tag unless the default slot is forced to render. StateMessage is left
// un-stubbed so its rendered text (the rate-limit message) is assertable.
function mountPage() {
  return shallowMount(SuggestFromListPage, {
    global: { renderStubDefaultSlot: true, stubs: { StateMessage: false } },
  })
}

function mockList(overrides: Partial<ReturnType<typeof useSuggestFromList>> = {}) {
  const mocked = {
    suggestions: ref<AiActivity[]>([]),
    loading: ref(false),
    failed: ref(false),
    rateLimitMessage: ref<string | null>(null),
    generate: vi.fn(async () => {}),
    save: vi.fn(async () => ({}) as Activity),
    ...overrides,
  }
  vi.mocked(useSuggestFromList).mockReturnValue(mocked)
  return mocked
}

describe('SuggestFromListPage', () => {
  it('should show the intro and let the user generate a batch of suggestions', async () => {
    // Arrange
    const list = mockList()
    const wrapper = mountPage()

    // Act
    await wrapper.find('[data-test="generate"]').trigger('click')

    // Assert
    expect(list.generate).toHaveBeenCalledOnce()
  })

  it('should show a loading state while generating', () => {
    // Arrange
    mockList({ loading: ref(true) })

    // Act
    const wrapper = mountPage()

    // Assert
    expect(wrapper.findComponent(StateLoading).exists()).toBe(true)
  })

  it('should show the rate-limit message when generation is rate-limited', () => {
    // Arrange
    mockList({ failed: ref(true), rateLimitMessage: ref('Je hebt vandaag genoeg suggesties gehad.') })

    // Act
    const wrapper = mountPage()

    // Assert
    expect(wrapper.findComponent(StateError).exists()).toBe(false)
    expect(wrapper.text()).toContain('Je hebt vandaag genoeg suggesties gehad.')
  })

  it('should show a generic error and let the user retry', async () => {
    // Arrange
    const list = mockList({ failed: ref(true) })
    const wrapper = mountPage()

    // Act
    await wrapper.findComponent(StateError).vm.$emit('retry')

    // Assert
    expect(list.generate).toHaveBeenCalledOnce()
  })

  it('should show the generated suggestions and let the user regenerate', async () => {
    // Arrange
    const list = mockList({ suggestions: ref(suggestions) })
    const wrapper = mountPage()
    expect(wrapper.findComponent(SuggestionList).props('suggestions')).toEqual(suggestions)

    // Act
    await wrapper.find('[data-test="regenerate"]').trigger('click')

    // Assert
    expect(list.generate).toHaveBeenCalledOnce()
  })
})
