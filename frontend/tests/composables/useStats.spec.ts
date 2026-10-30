import { describe, it, expect, vi } from 'vitest'
import { api } from '../../src/api/client'
import { useStats } from '../../src/composables/useStats'

describe('useStats', () => {
  it('should list the activities that left the user better off, best first', async () => {
    // Arrange
    vi.mocked(api).mockResolvedValueOnce({
      byActivity: [
        { id: 'a', title: 'Lezen', source: 'user', better: 1, same: 0, worse: 0 },
        { id: 'b', title: 'Wandelen', source: 'user', better: 3, same: 1, worse: 0 },
        { id: 'c', title: 'Tekenen', source: 'user', better: 2, same: 0, worse: 1 },
      ],
    })
    const { best, fetchStats } = useStats()

    // Act
    await fetchStats()

    // Assert
    expect(best.value.map((activity) => activity.title)).toEqual(['Wandelen', 'Lezen', 'Tekenen'])
  })

  it('should list the activities that left the user worse off, worst first', async () => {
    // Arrange
    vi.mocked(api).mockResolvedValueOnce({
      byActivity: [
        { id: 'a', title: 'Gamen', source: 'user', better: 0, same: 0, worse: 1 },
        { id: 'b', title: 'Scrollen', source: 'user', better: 0, same: 1, worse: 3 },
      ],
    })
    const { worst, fetchStats } = useStats()

    // Act
    await fetchStats()

    // Assert
    expect(worst.value.map((activity) => activity.title)).toEqual(['Scrollen', 'Gamen'])
  })

  it('should leave out activities that made no clear difference', async () => {
    // Arrange
    vi.mocked(api).mockResolvedValueOnce({
      byActivity: [
        { id: 'a', title: 'Thee drinken', source: 'user', better: 0, same: 2, worse: 0 },
        { id: 'b', title: 'Puzzelen', source: 'user', better: 1, same: 0, worse: 1 },
      ],
    })
    const { best, worst, fetchStats } = useStats()

    // Act
    await fetchStats()

    // Assert
    expect(best.value).toEqual([])
    expect(worst.value).toEqual([])
  })

  it('should flag an error when the stats could not be loaded', async () => {
    // Arrange
    vi.mocked(api).mockRejectedValueOnce(new Error('offline'))
    const { error, fetchStats } = useStats()

    // Act
    await fetchStats()

    // Assert
    expect(error.value).toBe(true)
  })
})
