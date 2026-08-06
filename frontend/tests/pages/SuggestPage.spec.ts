import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import SuggestPage from '../../src/pages/SuggestPage.vue'
import ActivityCard from '../../src/components/ActivityCard.vue'
import ActivityActionSheet from '../../src/components/ActivityActionSheet.vue'
import StateLoading from '../../src/components/StateLoading.vue'
import StateError from '../../src/components/StateError.vue'
import WelcomeCard from '../../src/components/WelcomeCard.vue'
import TextButton from '../../src/components/TextButton.vue'
import { useActivities } from '../../src/composables/useActivities'
import { makeUseActivitiesMock } from '../../src/composables/__mocks__/useActivities'
import {
  useSuggestionFlow,
  suggestFilterStressState,
  suggestFilterCategoriesState,
} from '../../src/composables/useSuggestionFlow'
import { useWelcome } from '../../src/composables/useWelcome'
import { setChatSeed } from '../../src/composables/useChat'
import type { Activity } from '../../src/types/activity'

vi.mock('../../src/composables/useActivities')
vi.mock('../../src/composables/useSuggestionFlow', () => ({
  useSuggestionFlow: vi.fn(),
  suggestFilterStressState: ref<number | null>(null),
  suggestFilterCategoriesState: ref<string[]>([]),
}))
vi.mock('../../src/composables/useWelcome')
vi.mock('../../src/composables/useChat', () => ({ setChatSeed: vi.fn() }))
vi.mock('vue-router', () => ({ useRouter: vi.fn() }))

const baseActivity = {
  id: '1',
  title: 'Even wandelen',
  description: '',
  suggested_duration: 15,
  min_stress_level: 1,
  max_stress_level: 5,
  categories: [],
  source: 'base',
} as unknown as Activity

function mockWelcomed() {
  vi.mocked(useWelcome).mockReturnValue({
    isWelcomed: ref(true),
    dismiss: vi.fn(),
    showMenuHint: ref(false),
    dismissMenuHint: vi.fn(),
  })
}

function mockFlow(overrides: Partial<ReturnType<typeof useSuggestionFlow>> = {}) {
  vi.mocked(useSuggestionFlow).mockReturnValue({
    current: ref(null),
    accepted: ref(false),
    next: vi.fn(),
    handleAccept: vi.fn(),
    handleSkip: vi.fn(),
    ...overrides,
  })
}

// PageShell has no script — just a slot — so shallowMount stubs it into an
// empty tag unless the default slot is forced to render. Every SuggestPage
// mount needs this, since the entire template lives inside <PageShell>.
// StateMessage is left un-stubbed too: its `#action` named slot (the "clear
// filters" button) doesn't render via renderStubDefaultSlot, which only
// covers the default slot.
function mountPage() {
  return shallowMount(SuggestPage, {
    global: { renderStubDefaultSlot: true, stubs: { StateMessage: false } },
  })
}

// Suggest-hub filters are module-level singletons (shared with the real
// SuggestFilters component across navigations) — reset them so no test leaks
// filter state into the next.
function clearSuggestFilters() {
  suggestFilterStressState.value = null
  suggestFilterCategoriesState.value = []
}

// SuggestPage stacks more distinct user-visible states than any other screen
// (welcome gate, loading/error/empty/filtered-empty, active suggestion, plus
// the swipe-up action sheet) — 9 tests instead of the usual 3-5 so each state
// keeps its own assertion, per the test-budget heuristic (see
// suggestionWeighting.spec.ts for the same kind of documented override).
describe('SuggestPage', () => {
  it('should hide the welcome card once dismissed', async () => {
    // Arrange
    const isWelcomed = ref(false)
    const dismiss = vi.fn(() => {
      isWelcomed.value = true
    })
    vi.mocked(useWelcome).mockReturnValue({
      isWelcomed,
      dismiss,
      showMenuHint: ref(false),
      dismissMenuHint: vi.fn(),
    })
    vi.mocked(useActivities).mockReturnValue(makeUseActivitiesMock({ loaded: ref(false) }))
    mockFlow()
    const wrapper = mountPage()
    expect(wrapper.findComponent(WelcomeCard).exists()).toBe(true)

    // Act
    await wrapper.findComponent(WelcomeCard).vm.$emit('dismiss')

    // Assert
    expect(dismiss).toHaveBeenCalledOnce()
    expect(wrapper.findComponent(WelcomeCard).exists()).toBe(false)
  })

  it('should show a loading state while activities are being fetched', () => {
    // Arrange
    mockWelcomed()
    vi.mocked(useActivities).mockReturnValue(makeUseActivitiesMock({ loaded: ref(false) }))
    mockFlow()

    // Act
    const wrapper = mountPage()

    // Assert
    expect(wrapper.findComponent(StateLoading).exists()).toBe(true)
    expect(wrapper.findComponent(StateError).exists()).toBe(false)
  })

  it('should show an error state and let the user retry the fetch', async () => {
    // Arrange
    mockWelcomed()
    const fetchActivities = vi.fn()
    vi.mocked(useActivities).mockReturnValue(
      makeUseActivitiesMock({ loaded: ref(false), error: ref(true), fetchActivities }),
    )
    mockFlow()
    const wrapper = mountPage()
    // onMounted already fired one fetch (loaded is false) — clear it so the
    // assertion below isolates the retry click's own call.
    fetchActivities.mockClear()

    // Act
    await wrapper.findComponent(StateError).vm.$emit('retry')

    // Assert
    expect(fetchActivities).toHaveBeenCalledOnce()
  })

  it('should show the empty-library message when no activities exist at all', () => {
    // Arrange
    mockWelcomed()
    clearSuggestFilters()
    vi.mocked(useActivities).mockReturnValue(
      makeUseActivitiesMock({ isEmpty: computed(() => true) }),
    )
    mockFlow()

    // Act
    const wrapper = mountPage()

    // Assert
    expect(wrapper.text()).toContain('activity.empty')
  })

  it('should show a filtered no-match message and let the user clear the filters', async () => {
    // Arrange
    mockWelcomed()
    vi.mocked(useActivities).mockReturnValue(
      makeUseActivitiesMock({
        activities: ref([baseActivity]),
        filterByIncludedCategories: vi.fn(() => []),
      }),
    )
    mockFlow()
    suggestFilterCategoriesState.value = ['Hands']
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('filter.noMatch')

    // Act
    await wrapper.findComponent(TextButton).trigger('click')

    // Assert
    expect(suggestFilterCategoriesState.value).toEqual([])
  })

  it('should show the current activity and let the user accept it', async () => {
    // Arrange
    mockWelcomed()
    clearSuggestFilters()
    vi.mocked(useActivities).mockReturnValue(
      makeUseActivitiesMock({ activities: ref([baseActivity]) }),
    )
    const handleAccept = vi.fn()
    mockFlow({ current: ref(baseActivity), handleAccept })
    const wrapper = mountPage()

    // Act
    await wrapper.findComponent(ActivityCard).vm.$emit('accept')

    // Assert
    expect(handleAccept).toHaveBeenCalledOnce()
  })

  it('should let the user skip the current activity', async () => {
    // Arrange
    mockWelcomed()
    clearSuggestFilters()
    vi.mocked(useActivities).mockReturnValue(
      makeUseActivitiesMock({ activities: ref([baseActivity]) }),
    )
    const handleSkip = vi.fn()
    mockFlow({ current: ref(baseActivity), handleSkip })
    const wrapper = mountPage()

    // Act
    await wrapper.findComponent(ActivityCard).vm.$emit('skip')

    // Assert
    expect(handleSkip).toHaveBeenCalledOnce()
  })

  it('should let the user remove an activity from the action sheet', async () => {
    // Arrange
    mockWelcomed()
    clearSuggestFilters()
    const deleteActivity = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useActivities).mockReturnValue(
      makeUseActivitiesMock({ activities: ref([baseActivity]), deleteActivity }),
    )
    mockFlow({ current: ref(baseActivity) })
    const wrapper = mountPage()
    await wrapper.find('[aria-label="suggest.actions.open"]').trigger('click')
    expect(wrapper.findComponent(ActivityActionSheet).exists()).toBe(true)

    // Act
    await wrapper.findComponent(ActivityActionSheet).vm.$emit('delete')
    await flushMicrotasks()

    // Assert
    expect(deleteActivity).toHaveBeenCalledWith(baseActivity.id)
    expect(wrapper.findComponent(ActivityActionSheet).exists()).toBe(false)
  })

  it('should seed the chat with the snapshotted activity and navigate there', async () => {
    // Arrange
    mockWelcomed()
    clearSuggestFilters()
    vi.mocked(useActivities).mockReturnValue(
      makeUseActivitiesMock({ activities: ref([baseActivity]) }),
    )
    mockFlow({ current: ref(baseActivity) })
    const push = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>)
    const wrapper = mountPage()
    await wrapper.find('[aria-label="suggest.actions.open"]').trigger('click')

    // Act
    await wrapper.findComponent(ActivityActionSheet).vm.$emit('chat')

    // Assert
    expect(setChatSeed).toHaveBeenCalledWith(baseActivity)
    expect(push).toHaveBeenCalledWith('/chat')
  })
})

function flushMicrotasks() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}
