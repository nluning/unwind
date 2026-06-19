// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import type { Activity } from '../types/activity.js'
import SuggestionList from './SuggestionList.vue'
import { api } from '../api/client.js'

vi.mock('../api/client.js', () => ({ api: vi.fn(() => Promise.resolve()) }))

const stubT = { global: { mocks: { $t: (key: string) => key } } }

const oneSuggestion = [
  { title: 'Lees een boek', description: 'Een half uur fictie', category: 'Head', duration_minutes: 30 },
]

function createdActivity(): Activity {
  return {
    id: 'created-1',
    title: 'Lees een boek',
    description: 'Een half uur fictie',
    suggested_duration: 30,
    min_stress_level: 1,
    max_stress_level: 5,
    source: 'ai',
    times_accepted: 0,
    times_skipped: 0,
    categories: ['Head'],
  }
}

describe('SuggestionList', () => {
  it('should show the full details of each suggestion', () => {
    // Arrange & Act
    const wrapper = mount(SuggestionList, {
      props: { suggestions: oneSuggestion, save: vi.fn() },
      ...stubT,
    })

    // Assert
    expect(wrapper.text()).toContain('Lees een boek')
    expect(wrapper.text()).toContain('Een half uur fictie')
  })

  it('should keep the "added" confirmation and offer "Doen" once a suggestion is added', async () => {
    // Arrange
    const save = vi.fn().mockResolvedValue(createdActivity())
    const wrapper = mount(SuggestionList, {
      props: { suggestions: oneSuggestion, save },
      ...stubT,
    })

    // Act
    await wrapper.find('button').trigger('click') // add to list
    await flushPromises()

    // Assert
    expect(save).toHaveBeenCalledWith(oneSuggestion[0])
    expect(wrapper.text()).toContain('suggestFromList.added')
    expect(wrapper.text()).toContain('activity.accept')
  })

  it('should confirm and log when the user does the added activity', async () => {
    // Arrange
    const wrapper = mount(SuggestionList, {
      props: { suggestions: oneSuggestion, save: vi.fn().mockResolvedValue(createdActivity()) },
      ...stubT,
    })
    await wrapper.find('button').trigger('click') // add to list
    await flushPromises()

    // Act
    await wrapper.find('button').trigger('click') // Doen

    // Assert
    expect(wrapper.text()).toContain('suggest.accepted')
    expect(vi.mocked(api)).toHaveBeenCalledWith('/usage-events', {
      method: 'POST',
      body: JSON.stringify({ activity_id: 'created-1', action: 'accepted', mode: 'mode1' }),
    })
  })

  it('should keep the add button so the user can retry when saving fails', async () => {
    // Arrange
    const save = vi.fn().mockRejectedValue(new Error('network'))
    const wrapper = mount(SuggestionList, {
      props: { suggestions: oneSuggestion, save },
      ...stubT,
    })

    // Act
    await wrapper.find('button').trigger('click')
    await flushPromises()

    // Assert
    expect(wrapper.text()).toContain('suggestFromList.add')
    expect(wrapper.text()).not.toContain('activity.accept')
  })
})
