import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { api, ApiError, NetworkError } from '../../src/api/client'
import { useAuth } from '../../src/composables/useAuth'
import { flushOutbox, queueRequest } from '../../src/composables/useOutbox'
import { clearLocalData, enqueue, listOutbox } from '../../src/utils/localDb'

vi.mock('../../src/composables/useAuth')

function signInAs(userId: string | null) {
  vi.mocked(useAuth).mockReturnValue({
    user: ref(userId ? { id: userId } : null),
  } as unknown as ReturnType<typeof useAuth>)
}

async function queueEvent(ownerId: string, path: string) {
  await enqueue({ ownerId, method: 'POST', path, body: '{}' })
}

describe('useOutbox', () => {
  beforeEach(async () => {
    await clearLocalData()
    vi.mocked(api).mockReset()
    signInAs('user-1')
  })

  it('should send queued requests in the order they were queued', async () => {
    // Arrange
    vi.mocked(api).mockResolvedValue(undefined)
    await queueEvent('user-1', '/first')
    await queueEvent('user-1', '/second')

    // Act
    await flushOutbox()

    // Assert
    expect(vi.mocked(api).mock.calls.map(([path]) => path)).toEqual(['/first', '/second'])
    expect(await listOutbox()).toEqual([])
  })

  it('should keep everything queued and stop when the network is down', async () => {
    // Arrange
    vi.mocked(api).mockRejectedValue(new NetworkError(new TypeError('Failed to fetch')))
    await queueEvent('user-1', '/first')
    await queueEvent('user-1', '/second')

    // Act
    await flushOutbox()

    // Assert — only the first was tried: the second must not overtake it
    expect(api).toHaveBeenCalledTimes(1)
    expect(await listOutbox()).toHaveLength(2)
  })

  it.each([401, 429, 503])('should keep the request queued on a %i response', async (status) => {
    // Arrange
    vi.mocked(api).mockRejectedValue(new ApiError(status, null))
    await queueEvent('user-1', '/first')

    // Act
    await flushOutbox()

    // Assert
    expect(await listOutbox()).toHaveLength(1)
  })

  it('should drop a request the server rejects so it cannot block the queue', async () => {
    // Arrange
    vi.mocked(api).mockRejectedValueOnce(new ApiError(400, null)).mockResolvedValueOnce(undefined)
    await queueEvent('user-1', '/poison')
    await queueEvent('user-1', '/fine')

    // Act
    await flushOutbox()

    // Assert
    expect(api).toHaveBeenCalledTimes(2)
    expect(await listOutbox()).toEqual([])
  })

  it('should never replay another user\'s requests under the current session', async () => {
    // Arrange
    vi.mocked(api).mockResolvedValue(undefined)
    await queueEvent('someone-else', '/theirs')

    // Act
    await flushOutbox()

    // Assert
    expect(api).not.toHaveBeenCalled()
    expect(await listOutbox()).toEqual([])
  })

  it('should leave the queue alone while nobody is signed in', async () => {
    // Arrange
    signInAs(null)
    await queueEvent('user-1', '/first')

    // Act
    await flushOutbox()

    // Assert
    expect(api).not.toHaveBeenCalled()
    expect(await listOutbox()).toHaveLength(1)
  })

  it('should send each request once when flushes overlap', async () => {
    // Arrange
    vi.mocked(api).mockResolvedValue(undefined)
    await queueEvent('user-1', '/first')

    // Act
    await Promise.all([flushOutbox(), flushOutbox(), flushOutbox()])

    // Assert
    expect(api).toHaveBeenCalledTimes(1)
  })

  it('should pick up a request queued while a flush is already running', async () => {
    // Arrange
    let releaseFirst: () => void = () => {}
    vi.mocked(api).mockImplementationOnce(
      () => new Promise<void>((resolve) => { releaseFirst = resolve }),
    )
    vi.mocked(api).mockResolvedValue(undefined)
    await queueEvent('user-1', '/first')
    const running = flushOutbox()
    await vi.waitFor(() => expect(api).toHaveBeenCalledTimes(1))

    // Act
    await queueEvent('user-1', '/second')
    await flushOutbox()
    releaseFirst()
    await running

    // Assert
    expect(vi.mocked(api).mock.calls.map(([path]) => path)).toEqual(['/first', '/second'])
  })

  it('should store a queued request with its owner and try to send it right away', async () => {
    // Arrange
    vi.mocked(api).mockRejectedValue(new NetworkError(new TypeError('Failed to fetch')))

    // Act
    await queueRequest('POST', '/usage-events', { id: 'event-1' })
    await vi.waitFor(() => expect(api).toHaveBeenCalled())

    // Assert
    expect(await listOutbox()).toMatchObject([
      { ownerId: 'user-1', method: 'POST', path: '/usage-events', body: '{"id":"event-1"}' },
    ])
  })

  it('should not queue anything without a session', async () => {
    // Arrange
    signInAs(null)

    // Act
    await queueRequest('POST', '/usage-events', { id: 'event-1' })

    // Assert
    expect(await listOutbox()).toEqual([])
  })
})
