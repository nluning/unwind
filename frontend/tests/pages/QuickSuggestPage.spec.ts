import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import { createI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import QuickSuggestPage from '../../src/pages/QuickSuggestPage.vue'
import OnboardingOptionPills from '../../src/components/OnboardingOptionPills.vue'
import StepActions from '../../src/components/OnboardingStepActions.vue'
import StateLoading from '../../src/components/StateLoading.vue'
import StateError from '../../src/components/StateError.vue'
import SuggestionAccepted from '../../src/components/SuggestionAccepted.vue'
import { useSuggestFromAnswers } from '../../src/composables/useSuggestFromAnswers'
import type { AiActivity } from '../../src/utils/parseActivity'

vi.mock('../../src/composables/useSuggestFromAnswers')
vi.mock('vue-router', () => ({ useRouter: vi.fn() }))

const suggestion: AiActivity = {
  title: 'Even wandelen',
  description: 'Rondje om het blok',
  duration_minutes: 15,
  category: 'movement',
} as unknown as AiActivity

// Unlike most pages, QuickSuggestPage reads useI18n().t() directly (to build
// question option labels), not just the template $t — the global passthrough
// mock in setup.ts only covers the latter, so the real plugin has to be
// installed here.
const i18n = createI18n({
  legacy: false,
  locale: 'nl',
  messages: {
    nl: {
      quickSuggest: {
        indoor: 'Binnen',
        outdoor: 'Buiten',
        noPreference: 'Maakt niet uit',
        alone: 'Alleen',
        withOthers: 'Met anderen',
        calm: 'Rustig',
        active: 'Actief',
      },
    },
  },
})

// PageShell has no script — just a slot — so shallowMount stubs it into an
// empty tag unless the default slot is forced to render.
function mountPage() {
  return shallowMount(QuickSuggestPage, {
    global: { renderStubDefaultSlot: true, plugins: [i18n] },
  })
}

function mockAnswers(overrides: Partial<ReturnType<typeof useSuggestFromAnswers>> = {}) {
  const mocked = {
    suggestion: ref<AiActivity | null>(null),
    loading: ref(false),
    failed: ref(false),
    rateLimitMessage: ref<string | null>(null),
    generate: vi.fn(async () => {}),
    save: vi.fn(async () => {}),
    ...overrides,
  }
  vi.mocked(useSuggestFromAnswers).mockReturnValue(mocked)
  return mocked
}

async function pick(wrapper: ReturnType<typeof mountPage>, value: string) {
  await wrapper.findComponent(OnboardingOptionPills).vm.$emit('update:modelValue', value)
}

// Five phases (questions/loading/failed/result/doing) plus revisit-vs-first-pass
// branching push this past the usual 3-6 budget.
describe('QuickSuggestPage', () => {
  it('should collect answers across the three questions and generate on the last one', async () => {
    // Arrange
    const answers = mockAnswers()
    const wrapper = mountPage()

    // Act
    await pick(wrapper, 'indoor')
    await pick(wrapper, 'alone')
    await pick(wrapper, 'no_preference')

    // Assert
    expect(answers.generate).toHaveBeenCalledWith({ location: 'indoor', social: 'alone' }, [])
  })

  it('should let the user revisit an earlier question without auto-advancing', async () => {
    // Arrange
    mockAnswers()
    const wrapper = mountPage()
    await pick(wrapper, 'indoor')

    // Act
    await wrapper.findComponent(StepActions).vm.$emit('back')
    await pick(wrapper, 'outdoor')

    // Assert
    expect(wrapper.findComponent(OnboardingOptionPills).exists()).toBe(true)
    expect(wrapper.findComponent(StepActions).props('showContinue')).toBe(true)
  })

  it('should return to the suggest hub when going back from the first question', async () => {
    // Arrange
    mockAnswers()
    const push = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>)
    const wrapper = mountPage()

    // Act
    await wrapper.findComponent(StepActions).vm.$emit('back')

    // Assert
    expect(push).toHaveBeenCalledWith({ name: 'suggest' })
  })

  it('should show a loading state while a suggestion is being generated', async () => {
    // Arrange
    let resolveGenerate: () => void = () => {}
    const answers = mockAnswers({
      generate: vi.fn(
        () => new Promise<void>((resolve) => { resolveGenerate = resolve }),
      ),
    })
    const wrapper = mountPage()

    // Act
    await pick(wrapper, 'indoor')
    await pick(wrapper, 'alone')
    const advancing = pick(wrapper, 'no_preference')
    await nextTick()

    // Assert
    expect(wrapper.findComponent(StateLoading).exists()).toBe(true)
    resolveGenerate()
    await advancing
    expect(answers.generate).toHaveBeenCalledOnce()
  })

  it('should show the rate-limit message when generation fails with one', async () => {
    // Arrange
    const failed = ref(false)
    const rateLimitMessage = ref<string | null>(null)
    mockAnswers({
      failed,
      rateLimitMessage,
      generate: vi.fn(async () => {
        failed.value = true
        rateLimitMessage.value = 'Je hebt vandaag genoeg suggesties gehad.'
      }),
    })
    const wrapper = mountPage()

    // Act
    await pick(wrapper, 'indoor')
    await pick(wrapper, 'alone')
    await pick(wrapper, 'no_preference')

    // Assert
    expect(wrapper.findComponent(StateError).exists()).toBe(false)
    expect(wrapper.text()).toContain('Je hebt vandaag genoeg suggesties gehad.')
  })

  it('should show the suggestion result and let the user save it', async () => {
    // Arrange
    const save = vi.fn(async () => {})
    mockAnswers({ suggestion: ref(suggestion), save })
    const wrapper = mountPage()
    await pick(wrapper, 'indoor')
    await pick(wrapper, 'alone')
    await pick(wrapper, 'no_preference')

    // Assert
    expect(wrapper.text()).toContain('Even wandelen')

    // Act
    await wrapper.find('.uw-actions__secondary').trigger('click')

    // Assert
    expect(save).toHaveBeenCalledWith(suggestion)
  })

  it('should show the confirmation screen when the user commits to doing it now', async () => {
    // Arrange
    mockAnswers({ suggestion: ref(suggestion) })
    const wrapper = mountPage()
    await pick(wrapper, 'indoor')
    await pick(wrapper, 'alone')
    await pick(wrapper, 'no_preference')

    // Act
    await wrapper.find('.uw-actions__primary').trigger('click')

    // Assert
    expect(wrapper.findComponent(SuggestionAccepted).exists()).toBe(true)
  })

  it('should exclude the currently shown title when the user regenerates', async () => {
    // Arrange
    const answers = mockAnswers({ suggestion: ref(suggestion) })
    const wrapper = mountPage()
    await pick(wrapper, 'indoor')
    await pick(wrapper, 'alone')
    await pick(wrapper, 'no_preference')

    // Act
    await wrapper.find('.uw-text-button').trigger('click')

    // Assert
    expect(answers.generate).toHaveBeenLastCalledWith(
      { location: 'indoor', social: 'alone' },
      ['Even wandelen'],
    )
  })
})
