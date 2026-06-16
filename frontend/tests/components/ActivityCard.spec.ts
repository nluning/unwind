import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ActivityCard from '../../src/components/ActivityCard.vue'

// Translation is its own unit (useActivityTranslation.spec.ts). The shared mock
// passes the activity's own title/description straight through. $t is stubbed
// globally in tests/setup.ts.
vi.mock('../../src/composables/useActivityTranslation')

describe('ActivityCard', () => {
  it('should show the activity title and description', () => {
    // Arrange & Act
    const wrapper = shallowMount(ActivityCard, {
      props: {
        // @ts-expect-error partial test activity — only the rendered fields matter
        activity: {
          title: 'Even een rondje wandelen',
          description: 'Geen bestemming, gewoon lopen.',
        },
      },
    })

    // Assert
    expect(wrapper.text()).toContain('Even een rondje wandelen')
    expect(wrapper.text()).toContain('Geen bestemming, gewoon lopen.')
  })

  it('should let the parent handle accepting the activity', async () => {
    // Arrange
    const wrapper = shallowMount(ActivityCard, {
      props: {
        // @ts-expect-error partial test activity — only the rendered fields matter
        activity: { title: 'Even een rondje wandelen' },
      },
    })

    // Act
    await wrapper.find('[data-test="accept"]').trigger('click')

    // Assert
    expect(wrapper.emitted('accept')).toHaveLength(1)
  })

  it('should let the parent handle skipping the activity', async () => {
    // Arrange
    const wrapper = shallowMount(ActivityCard, {
      props: {
        // @ts-expect-error partial test activity — only the rendered fields matter
        activity: { title: 'Even een rondje wandelen' },
      },
    })

    // Act
    await wrapper.find('[data-test="skip"]').trigger('click')

    // Assert
    expect(wrapper.emitted('skip')).toHaveLength(1)
  })

  it('should hide the description when the activity has none', () => {
    // Arrange & Act
    const wrapper = shallowMount(ActivityCard, {
      props: {
        // @ts-expect-error partial test activity — only the rendered fields matter
        activity: { title: 'Even een rondje wandelen' },
      },
    })

    // Assert
    expect(wrapper.find('[data-test="description"]').exists()).toBe(false)
  })
})
