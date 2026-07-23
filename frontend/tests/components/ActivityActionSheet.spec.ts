import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import ActivityActionSheet from '../../src/components/ActivityActionSheet.vue'
import { useSuggestFromList } from '../../src/composables/useSuggestFromList'

vi.mock('../../src/composables/useSuggestFromList')

const stubT = { global: { mocks: { $t: (key: string) => key } } }

function mockComposable(overrides: Record<string, unknown> = {}) {
  vi.mocked(useSuggestFromList).mockReturnValue({
    suggestions: ref([]),
    loading: ref(false),
    failed: ref(false),
    rateLimitMessage: ref(null),
    generate: vi.fn(),
    save: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useSuggestFromList>)
}

describe('ActivityActionSheet', () => {
  it('should offer the three actions (labelled for assistive tech)', () => {
    // Arrange
    mockComposable()

    // Act
    const wrapper = mount(ActivityActionSheet, {
      props: {
        // @ts-expect-error partial test activity — only the rendered fields matter
        activity: { id: 'a1', title: 'Lees een boek' },
      },
      ...stubT,
    })

    // Assert
    const labels = wrapper.findAll('button').map((button) => button.attributes('aria-label'))
    expect(labels).toContain('suggest.actions.more')
    expect(labels).toContain('suggest.actions.remove')
    expect(labels).toContain('suggest.actions.chat')
  })

  it('should require a confirming second tap before removing the activity', async () => {
    // Arrange
    mockComposable()
    const wrapper = mount(ActivityActionSheet, {
      props: {
        // @ts-expect-error partial test activity — only the rendered fields matter
        activity: { id: 'a1', title: 'Lees een boek' },
      },
      ...stubT,
    })

    // Act
    await wrapper.findAll('button')[1]!.trigger('click') // arms the delete

    // Assert
    expect(wrapper.emitted('delete')).toBeUndefined()
    expect(wrapper.findAll('button')[1]!.attributes('aria-label')).toBe('activitiesList.deleteConfirm')
  })

  it('should remove the activity on the confirming second tap', async () => {
    // Arrange
    mockComposable()
    const wrapper = mount(ActivityActionSheet, {
      props: {
        // @ts-expect-error partial test activity — only the rendered fields matter
        activity: { id: 'a1', title: 'Lees een boek' },
      },
      ...stubT,
    })

    // Act
    await wrapper.findAll('button')[1]!.trigger('click') // arm
    await wrapper.findAll('button')[1]!.trigger('click') // confirm

    // Assert
    expect(wrapper.emitted('delete')).toHaveLength(1)
  })

  it('should generate suggestions anchored to this activity when "meer van dit" is chosen', async () => {
    // Arrange
    const generate = vi.fn()
    mockComposable({
      generate,
      suggestions: ref([{ title: 'Luister een luisterboek', category: 'Head', duration_minutes: 30 }]),
    })
    const wrapper = mount(ActivityActionSheet, {
      props: {
        // @ts-expect-error partial test activity — only the rendered fields matter
        activity: { id: 'seed-99', title: 'Lees een boek' },
      },
      ...stubT,
    })

    // Act
    await wrapper.findAll('button')[0]!.trigger('click') // meer van dit
    await flushPromises()

    // Assert
    expect(generate).toHaveBeenCalledWith('seed-99')
    expect(wrapper.text()).toContain('Luister een luisterboek')
  })

  it('should show the daily-limit message when the cap is hit', async () => {
    // Arrange
    mockComposable({ failed: ref(true), rateLimitMessage: ref('Limiet bereikt') })
    const wrapper = mount(ActivityActionSheet, {
      props: {
        // @ts-expect-error partial test activity — only the rendered fields matter
        activity: { id: 'a1', title: 'Lees een boek' },
      },
      ...stubT,
    })

    // Act
    await wrapper.findAll('button')[0]!.trigger('click') // meer van dit

    // Assert
    expect(wrapper.text()).toContain('Limiet bereikt')
  })
})
