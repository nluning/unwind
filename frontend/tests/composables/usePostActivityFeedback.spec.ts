import { describe, it, expect, vi } from 'vitest'
import { api } from '../../src/api/client'
import {
  usePostActivityFeedback,
  resetPostActivityFeedback,
} from '../../src/composables/usePostActivityFeedback'

describe('usePostActivityFeedback', () => {
  it('should ask about the activity the server says is waiting for an answer', async () => {
    // Arrange
    resetPostActivityFeedback()
    vi.mocked(api).mockResolvedValueOnce({
      pending: { id: 'event-1', activity: { id: 'a1', title: 'Walk', source: 'base' } },
    })
    const { target, checkPending } = usePostActivityFeedback()

    // Act
    await checkPending()

    // Assert
    expect(target.value).toEqual({
      eventId: 'event-1',
      activity: { id: 'a1', title: 'Walk', source: 'base' },
    })
  })

  it('should not interrupt the user when nothing is waiting for an answer', async () => {
    // Arrange
    resetPostActivityFeedback()
    vi.mocked(api).mockResolvedValueOnce({ pending: null })
    const { target, checkPending } = usePostActivityFeedback()

    // Act
    await checkPending()

    // Assert
    expect(target.value).toBeNull()
  })

  it('should not check while the device is offline', async () => {
    // Arrange
    resetPostActivityFeedback()
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValueOnce(false)
    vi.mocked(api).mockClear()
    const { checkPending } = usePostActivityFeedback()

    // Act
    await checkPending()

    // Assert
    expect(vi.mocked(api)).not.toHaveBeenCalled()
  })

  it('should check only once when several resume events fire together', async () => {
    // Arrange
    resetPostActivityFeedback()
    vi.mocked(api).mockClear()
    vi.mocked(api).mockResolvedValue({ pending: null })
    const { checkPending } = usePostActivityFeedback()

    // Act — visibilitychange, pageshow and focus in quick succession
    await Promise.all([checkPending(), checkPending(), checkPending()])

    // Assert
    expect(vi.mocked(api)).toHaveBeenCalledTimes(1)
    vi.mocked(api).mockReset()
  })

  it('should ask immediately about the activity the user says they are done with', async () => {
    // Arrange
    resetPostActivityFeedback()
    vi.mocked(api).mockClear()
    const { target, trackAccepted, openForLastAccepted } = usePostActivityFeedback()
    trackAccepted(
      { id: 'a1', title: 'Walk', source: 'base' },
      Promise.resolve({ id: 'event-1' }),
    )

    // Act
    await openForLastAccepted()

    // Assert — no request needed: the accept already told us which event it was
    expect(target.value?.eventId).toBe('event-1')
    expect(vi.mocked(api)).not.toHaveBeenCalled()
  })

  it('should store the answer and close the question', async () => {
    // Arrange
    resetPostActivityFeedback()
    vi.mocked(api).mockClear()
    vi.mocked(api).mockResolvedValueOnce({
      pending: { id: 'event-1', activity: { id: 'a1', title: 'Walk', source: 'base' } },
    })
    vi.mocked(api).mockResolvedValueOnce({ ok: true })
    const { target, checkPending, answer } = usePostActivityFeedback()
    await checkPending()

    // Act
    answer('better')

    // Assert
    expect(vi.mocked(api)).toHaveBeenLastCalledWith('/usage-events/event-1', {
      method: 'PATCH',
      body: JSON.stringify({ outcome: 'better' }),
    })
    expect(target.value).toBeNull()
  })

  it('should signal that a question was answered', async () => {
    // Arrange
    resetPostActivityFeedback()
    vi.mocked(api).mockClear()
    vi.mocked(api).mockResolvedValueOnce({
      pending: { id: 'event-3', activity: { id: 'a1', title: 'Walk', source: 'base' } },
    })
    vi.mocked(api).mockResolvedValueOnce({ ok: true })
    const { answered, checkPending, answer } = usePostActivityFeedback()
    await checkPending()
    const before = answered.value

    // Act
    answer('same')

    // Assert
    expect(answered.value).toBe(before + 1)
  })

  it('should not signal an answer when the question is skipped', async () => {
    // Arrange
    resetPostActivityFeedback()
    vi.mocked(api).mockClear()
    vi.mocked(api).mockResolvedValueOnce({
      pending: { id: 'event-4', activity: { id: 'a1', title: 'Walk', source: 'base' } },
    })
    vi.mocked(api).mockResolvedValueOnce({ ok: true })
    const { answered, checkPending, dismiss } = usePostActivityFeedback()
    await checkPending()
    const before = answered.value

    // Act
    dismiss()

    // Assert
    expect(answered.value).toBe(before)
  })

  it('should record a skipped question so it is not asked again', async () => {
    // Arrange
    resetPostActivityFeedback()
    vi.mocked(api).mockClear()
    vi.mocked(api).mockResolvedValueOnce({
      pending: { id: 'event-2', activity: { id: 'a1', title: 'Walk', source: 'base' } },
    })
    vi.mocked(api).mockResolvedValueOnce({ ok: true })
    const { checkPending, dismiss } = usePostActivityFeedback()
    await checkPending()

    // Act
    dismiss()

    // Assert
    expect(vi.mocked(api)).toHaveBeenLastCalledWith('/usage-events/event-2', {
      method: 'PATCH',
      body: JSON.stringify({ dismissed: true }),
    })
  })
})
