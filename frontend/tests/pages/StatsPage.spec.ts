import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { ref } from 'vue'
import StatsPage from '../../src/pages/StatsPage.vue'
import StateLoading from '../../src/components/StateLoading.vue'
import StateMessage from '../../src/components/StateMessage.vue'
import StateError from '../../src/components/StateError.vue'
import { useStats, type ActivityStats } from '../../src/composables/useStats'

vi.mock('../../src/composables/useStats')
vi.mock('../../src/composables/useActivityTranslation')

function mockStats({
  loaded = true,
  error = false,
  best = [],
  worst = [],
}: { loaded?: boolean; error?: boolean; best?: ActivityStats[]; worst?: ActivityStats[] } = {}) {
  const fetchStats = vi.fn()
  vi.mocked(useStats).mockReturnValue({
    stats: ref(loaded ? { byActivity: [...best, ...worst] } : null),
    error: ref(error),
    best: ref(best),
    worst: ref(worst),
    fetchStats,
  } as unknown as ReturnType<typeof useStats>)
  return fetchStats
}

function mountPage() {
  return shallowMount(StatsPage, { global: { renderStubDefaultSlot: true } })
}

describe('StatsPage', () => {
  it('should load the stats when the page opens', () => {
    // Arrange
    const fetchStats = mockStats({ loaded: false })

    // Act
    mountPage()

    // Assert
    expect(fetchStats).toHaveBeenCalledOnce()
  })

  it('should show a loading state until the stats have arrived', () => {
    // Arrange
    mockStats({ loaded: false })

    // Act
    const wrapper = mountPage()

    // Assert
    expect(wrapper.findComponent(StateLoading).exists()).toBe(true)
  })

  it('should say there is nothing to show yet when no activity stands out', () => {
    // Arrange
    mockStats()

    // Act
    const wrapper = mountPage()

    // Assert
    expect(wrapper.findComponent(StateMessage).exists()).toBe(true)
    expect(wrapper.find('[data-test="activity-row"]').exists()).toBe(false)
  })

  it('should show what works well and what works less as separate lists', () => {
    // Arrange
    mockStats({
      best: [{ id: 'a1', title: 'Ga wandelen', source: 'user', better: 3, same: 1, worse: 0 }],
      worst: [{ id: 'a2', title: 'Scrollen', source: 'user', better: 0, same: 0, worse: 2 }],
    })

    // Act
    const wrapper = mountPage()

    // Assert
    expect(wrapper.find('[data-test="group-best"]').text()).toContain('Ga wandelen')
    expect(wrapper.find('[data-test="group-worst"]').text()).toContain('Scrollen')
  })

  it('should leave out a list that has nothing in it', () => {
    // Arrange
    mockStats({
      best: [{ id: 'a1', title: 'Ga wandelen', source: 'user', better: 1, same: 0, worse: 0 }],
    })

    // Act
    const wrapper = mountPage()

    // Assert
    expect(wrapper.find('[data-test="group-worst"]').exists()).toBe(false)
  })

  it('should show only the top three of a longer list by default', () => {
    // Arrange
    mockStats({
      best: Array.from({ length: 5 }, (_, index) => ({
        id: `a${index}`,
        title: `Activiteit ${index + 1}`,
        source: 'user' as const,
        better: 5 - index,
        same: 0,
        worse: 0,
      })),
    })

    // Act
    const wrapper = mountPage()

    // Assert
    const titles = wrapper.findAll('[data-test="activity-row"]').map((row) => row.text())
    expect(titles).toHaveLength(3)
    expect(titles[2]).toContain('Activiteit 3')
  })

  it('should reveal the rest of the list when the user asks for more', async () => {
    // Arrange
    mockStats({
      best: Array.from({ length: 5 }, (_, index) => ({
        id: `a${index}`,
        title: `Activiteit ${index + 1}`,
        source: 'user' as const,
        better: 5 - index,
        same: 0,
        worse: 0,
      })),
    })
    const wrapper = mountPage()

    // Act
    await wrapper.find('[data-test="toggle-best"]').trigger('click')

    // Assert
    expect(wrapper.findAll('[data-test="activity-row"]')).toHaveLength(5)
    expect(wrapper.find('[data-test="toggle-best"]').attributes('aria-expanded')).toBe('true')
  })

  it('should collapse the list again when the user asks for less', async () => {
    // Arrange
    mockStats({
      best: Array.from({ length: 5 }, (_, index) => ({
        id: `a${index}`,
        title: `Activiteit ${index + 1}`,
        source: 'user' as const,
        better: 5 - index,
        same: 0,
        worse: 0,
      })),
    })
    const wrapper = mountPage()
    await wrapper.find('[data-test="toggle-best"]').trigger('click')

    // Act
    await wrapper.find('[data-test="toggle-best"]').trigger('click')

    // Assert
    expect(wrapper.findAll('[data-test="activity-row"]')).toHaveLength(3)
  })

  it('should expand "werkt minder" without expanding "werkt goed"', async () => {
    // Arrange
    mockStats({
      best: Array.from({ length: 4 }, (_, index) => ({
        id: `b${index}`,
        title: `Goed ${index + 1}`,
        source: 'user' as const,
        better: 4 - index,
        same: 0,
        worse: 0,
      })),
      worst: Array.from({ length: 4 }, (_, index) => ({
        id: `w${index}`,
        title: `Minder ${index + 1}`,
        source: 'user' as const,
        better: 0,
        same: 0,
        worse: 4 - index,
      })),
    })
    const wrapper = mountPage()

    // Act
    await wrapper.find('[data-test="toggle-worst"]').trigger('click')

    // Assert
    expect(wrapper.findAll('[data-test="group-worst"] [data-test="activity-row"]')).toHaveLength(4)
    expect(wrapper.findAll('[data-test="group-best"] [data-test="activity-row"]')).toHaveLength(3)
  })

  it('should not offer "meer laten zien" when a list has three activities or fewer', () => {
    // Arrange
    mockStats({
      best: [
        { id: 'a1', title: 'Ga wandelen', source: 'user', better: 2, same: 0, worse: 0 },
        { id: 'a2', title: 'Lezen', source: 'user', better: 1, same: 0, worse: 0 },
        { id: 'a3', title: 'Tekenen', source: 'user', better: 1, same: 0, worse: 0 },
      ],
    })

    // Act
    const wrapper = mountPage()

    // Assert
    expect(wrapper.find('[data-test="toggle-best"]').exists()).toBe(false)
  })

  it('should let the user retry when the stats could not be loaded', () => {
    // Arrange
    const fetchStats = mockStats({ loaded: false, error: true })
    const wrapper = mountPage()
    fetchStats.mockClear()

    // Act
    wrapper.findComponent(StateError).vm.$emit('retry')

    // Assert
    expect(fetchStats).toHaveBeenCalledOnce()
  })
})
