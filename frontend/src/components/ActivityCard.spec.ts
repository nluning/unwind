// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import type { Activity } from '../types/activity.js'
import ActivityCard from './ActivityCard.vue'

vi.mock('../composables/useActivityTranslation.js', () => ({
  useActivityTranslation: () => ({
    titleFor: (activity: Activity) => activity.title,
    descriptionFor: (activity: Activity) => activity.description,
  }),
}))

const stubT = { global: { mocks: { $t: (key: string) => key } } }

function walkActivity(): Activity {
  return {
    id: '1',
    title: 'Ga een rondje lopen',
    description: 'Geen bestemming, gewoon lopen.',
    suggested_duration: 15,
    min_stress_level: 1,
    max_stress_level: 5,
    source: 'user',
    times_accepted: 0,
    times_skipped: 0,
    categories: ['Hands'],
  }
}

describe('ActivityCard', () => {
  it("should let the parent handle acceptance once the accept button's exit animation finishes", async () => {
    // Arrange
    const wrapper = shallowMount(ActivityCard, { props: { activity: walkActivity() }, ...stubT })

    // Act
    await wrapper.get('[aria-label="activity.accept"]').trigger('click')
    await wrapper.trigger('transitionend')

    // Assert
    expect(wrapper.emitted('accept')).toHaveLength(1)
  })

  it("should let the parent handle skipping once the skip button's exit animation finishes", async () => {
    // Arrange
    const wrapper = shallowMount(ActivityCard, { props: { activity: walkActivity() }, ...stubT })

    // Act
    await wrapper.get('[aria-label="activity.skip"]').trigger('click')
    await wrapper.trigger('transitionend')

    // Assert
    expect(wrapper.emitted('skip')).toHaveLength(1)
  })

  it('should expose correct Dutch labels for screen readers on both buttons', () => {
    // Arrange & Act
    const wrapper = shallowMount(ActivityCard, { props: { activity: walkActivity() }, ...stubT })

    // Assert
    expect(wrapper.find('[aria-label="activity.skip"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="activity.accept"]').exists()).toBe(true)
  })

  it("should let the parent handle acceptance once a completed right-drag's exit animation finishes", async () => {
    // Arrange
    const wrapper = shallowMount(ActivityCard, { props: { activity: walkActivity() }, ...stubT })

    // Act
    await wrapper.trigger('touchstart', { touches: [{ clientX: 100, clientY: 300 }] })
    await wrapper.trigger('touchmove', { touches: [{ clientX: 260, clientY: 300 }] })
    await wrapper.trigger('touchend', { changedTouches: [{ clientX: 260, clientY: 300 }] })
    await wrapper.trigger('transitionend')

    // Assert
    expect(wrapper.emitted('accept')).toHaveLength(1)
  })

  it("should let the parent handle skipping once a completed left-drag's exit animation finishes", async () => {
    // Arrange
    const wrapper = shallowMount(ActivityCard, { props: { activity: walkActivity() }, ...stubT })

    // Act
    await wrapper.trigger('touchstart', { touches: [{ clientX: 260, clientY: 300 }] })
    await wrapper.trigger('touchmove', { touches: [{ clientX: 100, clientY: 300 }] })
    await wrapper.trigger('touchend', { changedTouches: [{ clientX: 100, clientY: 300 }] })
    await wrapper.trigger('transitionend')

    // Assert
    expect(wrapper.emitted('skip')).toHaveLength(1)
  })

  it('should let the parent open the action sheet on an upward swipe', async () => {
    // Arrange
    const wrapper = shallowMount(ActivityCard, { props: { activity: walkActivity() }, ...stubT })

    // Act
    await wrapper.trigger('touchstart', { touches: [{ clientX: 100, clientY: 300 }] })
    await wrapper.trigger('touchmove', { touches: [{ clientX: 100, clientY: 220 }] })
    await wrapper.trigger('touchend', { changedTouches: [{ clientX: 100, clientY: 220 }] })

    // Assert
    expect(wrapper.emitted('open-sheet')).toHaveLength(1)
  })
})
