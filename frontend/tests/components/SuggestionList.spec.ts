import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SuggestionList from '../../src/components/SuggestionList.vue'
import { api } from '../../src/api/client'

const stubT = { global: { mocks: { $t: (key: string) => key } } }

const oneSuggestion = [
  { title: 'Lees een boek', description: 'Een half uur fictie', category: 'Head', duration_minutes: 30 },
]

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
    const save = vi.fn().mockResolvedValue({ id: 'created-1', title: 'Lees een boek' })
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
    vi.mocked(api).mockResolvedValueOnce(undefined)
    const wrapper = mount(SuggestionList, {
      props: {
        suggestions: oneSuggestion,
        save: vi.fn().mockResolvedValue({ id: 'created-1', title: 'Lees een boek' }),
      },
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
