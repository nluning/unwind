import { describe, it, expect, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ActivityFormPage from '../../src/pages/ActivityFormPage.vue'
import ToggleButton from '../../src/components/ToggleButton.vue'
import TextField from '../../src/components/TextField.vue'
import { useActivities } from '../../src/composables/useActivities'
import { makeUseActivitiesMock } from '../../src/composables/__mocks__/useActivities'
import type { Activity } from '../../src/types/activity'

vi.mock('../../src/composables/useActivities')
vi.mock('vue-router', () => ({ useRoute: vi.fn(), useRouter: vi.fn() }))

const existingActivity = {
  id: '2',
  title: 'Eigen activiteit',
  description: 'Zelf toegevoegd',
  suggested_duration: 20,
  min_stress_level: 2,
  max_stress_level: 4,
  categories: ['Hands'],
  source: 'user',
} as unknown as Activity

function mockRoute(params: Record<string, string> = {}) {
  vi.mocked(useRoute).mockReturnValue({ params } as unknown as ReturnType<typeof useRoute>)
}

// PageShell has no script — just a slot — so shallowMount stubs it into an
// empty tag unless the default slot is forced to render. onMounted awaits
// even when no real await is hit internally, so every call flushes pending
// promises before the form (behind `ready`) is usable.
async function mountPage() {
  const wrapper = shallowMount(ActivityFormPage, {
    global: { renderStubDefaultSlot: true },
  })
  await flushPromises()
  return wrapper
}

describe('ActivityFormPage', () => {
  it('should create a new activity with the selected category and navigate to the list', async () => {
    // Arrange
    mockRoute()
    const createActivity = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useActivities).mockReturnValue(
      makeUseActivitiesMock({ createActivity }),
    )
    const push = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push, replace: vi.fn() } as unknown as ReturnType<typeof useRouter>)
    const wrapper = await mountPage()
    await wrapper.findComponent(ToggleButton).vm.$emit('click')

    // Act
    await wrapper.find('form').trigger('submit')

    // Assert
    expect(createActivity).toHaveBeenCalledWith(
      expect.objectContaining({ category_ids: [1] }),
    )
    expect(push).toHaveBeenCalledWith('/activities')
  })

  it('should prefill the form when editing an existing activity', async () => {
    // Arrange
    mockRoute({ id: '2' })
    vi.mocked(useActivities).mockReturnValue(
      makeUseActivitiesMock({ activities: ref([existingActivity]) }),
    )
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>)

    // Act
    const wrapper = await mountPage()

    // Assert
    expect(wrapper.findAllComponents(TextField)[0]!.props('modelValue')).toBe('Eigen activiteit')
  })

  it('should redirect to the list when editing an unknown activity id', async () => {
    // Arrange
    mockRoute({ id: 'missing' })
    vi.mocked(useActivities).mockReturnValue(
      makeUseActivitiesMock({ activities: ref([existingActivity]) }),
    )
    const replace = vi.fn()
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      replace,
    } as unknown as ReturnType<typeof useRouter>)

    // Act
    await mountPage()

    // Assert
    expect(replace).toHaveBeenCalledWith('/activities')
  })

  it('should require at least one category before saving', async () => {
    // Arrange
    mockRoute()
    const createActivity = vi.fn()
    vi.mocked(useActivities).mockReturnValue(makeUseActivitiesMock({ createActivity }))
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>)
    const wrapper = await mountPage()

    // Act
    await wrapper.find('form').trigger('submit')

    // Assert
    expect(createActivity).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('activitiesList.form.categoriesRequired')
  })

  it('should require the stress range to be in order before saving', async () => {
    // Arrange
    mockRoute()
    const createActivity = vi.fn()
    vi.mocked(useActivities).mockReturnValue(makeUseActivitiesMock({ createActivity }))
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>)
    const wrapper = await mountPage()
    await wrapper.findComponent(ToggleButton).vm.$emit('click')
    // The only raw <input type="number"> elements are the min/max stress
    // range — duration is a stubbed TextField, not a real <input>, here.
    const stressInputs = wrapper.findAll('input[type="number"]')
    await stressInputs[0]!.setValue(5)
    await stressInputs[1]!.setValue(1)

    // Act
    await wrapper.find('form').trigger('submit')

    // Assert
    expect(createActivity).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('activitiesList.form.stressOrder')
  })

  it('should let the user cancel back to the list', async () => {
    // Arrange
    mockRoute()
    vi.mocked(useActivities).mockReturnValue(makeUseActivitiesMock())
    const push = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push, replace: vi.fn() } as unknown as ReturnType<typeof useRouter>)
    const wrapper = await mountPage()

    // Act
    await wrapper.find('button[type="button"]').trigger('click')

    // Assert
    expect(push).toHaveBeenCalledWith('/activities')
  })
})
