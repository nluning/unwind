import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ActivityCard from '../../src/components/ActivityCard.vue'
import type { Activity } from '../../src/types/activity'

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: '1',
    title: 'Ga een rondje lopen',
    description: 'Geen bestemming, gewoon lopen.',
    suggested_duration: 15,
    min_stress_level: 1,
    max_stress_level: 5,
    source: 'base',
    times_skipped: 0,
    categories: ['Hands'],
    ...overrides,
  }
}

describe('ActivityCard', () => {
  it('should show complete activity information', () => {
    // Arrange
    const activity = makeActivity()

    // Act
    const wrapper = shallowMount(ActivityCard, {
      props: { activity },
      global: { mocks: { $t: (key: string, fallback: string) => fallback ?? key } },
    })

    // Assert
    expect(wrapper.text()).toContain('Ga een rondje lopen')
    expect(wrapper.text()).toContain('Geen bestemming, gewoon lopen.')
    expect(wrapper.text()).toContain('15')
  })

  it('should let parent handle accept action', async () => {
    // Arrange
    const wrapper = shallowMount(ActivityCard, {
      props: { activity: makeActivity() },
      global: { mocks: { $t: (key: string, fallback: string) => fallback ?? key } },
    })

    // Act
    await wrapper.find('.btn-accept').trigger('click')

    // Assert
    expect(wrapper.emitted('accept')).toHaveLength(1)
  })

  it('should let parent handle skip action', async () => {
    // Arrange
    const wrapper = shallowMount(ActivityCard, {
      props: { activity: makeActivity() },
      global: { mocks: { $t: (key: string, fallback: string) => fallback ?? key } },
    })

    // Act
    await wrapper.find('.btn-skip').trigger('click')

    // Assert
    expect(wrapper.emitted('skip')).toHaveLength(1)
  })
})
