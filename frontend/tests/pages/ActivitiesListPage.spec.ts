import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ActivitiesListPage from '../../src/pages/ActivitiesListPage.vue'
import ConfirmDeleteButton from '../../src/components/ConfirmDeleteButton.vue'
import { useActivities } from '../../src/composables/useActivities'
import { makeUseActivitiesMock } from '../../src/composables/__mocks__/useActivities'
import type { Activity } from '../../src/types/activity'

vi.mock('../../src/composables/useActivities')
vi.mock('../../src/composables/useActivityTranslation')
vi.mock('vue-router', () => ({ useRouter: vi.fn() }))

const baseActivity = {
  id: '1',
  title: 'Even wandelen',
  description: 'Rondje om het blok',
  suggested_duration: 15,
  min_stress_level: 1,
  max_stress_level: 5,
  categories: ['movement'],
  source: 'base',
} as unknown as Activity

const ownActivity = {
  ...baseActivity,
  id: '2',
  title: 'Eigen activiteit',
  source: 'user',
} as unknown as Activity

// PageShell has no script — just a slot — so shallowMount stubs it into an
// empty tag unless the default slot is forced to render. StateMessage is left
// un-stubbed too: its `#action` named slot (the "new activity" button)
// doesn't render via renderStubDefaultSlot, which only covers the default slot.
function mountPage() {
  return shallowMount(ActivitiesListPage, {
    global: { renderStubDefaultSlot: true, stubs: { StateMessage: false } },
  })
}

describe('ActivitiesListPage', () => {
  it('should show the empty state and let the user create their first activity', async () => {
    // Arrange
    vi.mocked(useActivities).mockReturnValue(makeUseActivitiesMock({ activities: ref([]) }))
    const push = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>)
    const wrapper = mountPage()

    // Act
    await wrapper.find('button').trigger('click')

    // Assert
    expect(push).toHaveBeenCalledWith('/activities/new')
  })

  it('should list the activities with their duration, categories, and stress range', () => {
    // Arrange
    vi.mocked(useActivities).mockReturnValue(
      makeUseActivitiesMock({ activities: ref([baseActivity]) }),
    )

    // Act
    const wrapper = mountPage()

    // Assert
    expect(wrapper.text()).toContain('Even wandelen')
    expect(wrapper.text()).toContain('Rondje om het blok')
  })

  it('should hide the edit button for base-library activities', () => {
    // Arrange
    vi.mocked(useActivities).mockReturnValue(
      makeUseActivitiesMock({ activities: ref([baseActivity]) }),
    )

    // Act
    const wrapper = mountPage()

    // Assert
    expect(wrapper.text()).not.toContain('activitiesList.editButton')
  })

  it("should let the user edit one of their own activities", async () => {
    // Arrange
    vi.mocked(useActivities).mockReturnValue(
      makeUseActivitiesMock({ activities: ref([ownActivity]) }),
    )
    const push = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>)
    const wrapper = mountPage()

    // Act
    const buttons = wrapper.findAll('button')
    await buttons[buttons.length - 1]!.trigger('click')

    // Assert
    expect(push).toHaveBeenCalledWith('/activities/2/edit')
  })

  it('should let the user delete an activity', async () => {
    // Arrange
    const deleteActivity = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useActivities).mockReturnValue(
      makeUseActivitiesMock({ activities: ref([baseActivity]), deleteActivity }),
    )
    const wrapper = mountPage()

    // Act
    wrapper.findComponent(ConfirmDeleteButton).vm.$emit('confirm')

    // Assert
    expect(deleteActivity).toHaveBeenCalledWith('1')
  })
})
