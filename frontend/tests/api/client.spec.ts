import { describe, it, expect, vi, afterEach } from 'vitest'
import * as Sentry from '@sentry/vue'
import { setOnline, useOnline } from '../../src/composables/useOnline'

vi.mock('@sentry/vue', () => ({ captureException: vi.fn() }))
vi.mock('../../src/router/index', () => ({ default: { push: vi.fn() } }))

// tests/setup.ts replaces the api client with a stub for every other spec; this
// one is about the real thing.
const { api, NetworkError, ApiError } =
  await vi.importActual<typeof import('../../src/api/client')>('../../src/api/client')

describe('api client', () => {
  // Restores the fetch / navigator.onLine fakes even when an assertion fails.
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('should fail with a NetworkError when the request gets no response', async () => {
    // Arrange
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    // Act
    const result = api('/activities')

    // Assert
    await expect(result).rejects.toBeInstanceOf(NetworkError)
    // jsdom says the device is online, so this failure was reported too.
    vi.mocked(Sentry.captureException).mockClear()
  })

  it('should stay quiet in Sentry when the device itself is offline', async () => {
    // Arrange
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)

    // Act
    await api('/activities').catch(() => {})

    // Assert
    expect(Sentry.captureException).not.toHaveBeenCalled()
  })

  it('should still report a network failure while the device thinks it is online', async () => {
    // Arrange
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)

    // Act
    await api('/activities').catch(() => {})

    // Assert
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(NetworkError), {
      tags: { endpoint: '/activities', method: 'GET', kind: 'network' },
    })
    vi.mocked(Sentry.captureException).mockClear()
  })

  it('should report a server error as an api failure with its status', async () => {
    // Arrange
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })))

    // Act
    const result = await api('/activities').catch((error) => error)

    // Assert
    expect(result).toBeInstanceOf(ApiError)
    expect(Sentry.captureException).toHaveBeenCalledWith(result, {
      tags: { endpoint: '/activities', method: 'GET', kind: 'api' },
    })
    vi.mocked(Sentry.captureException).mockClear()
  })

  it('should mark the app offline after a failed request', async () => {
    // Arrange
    setOnline(true)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    // Act
    await api('/activities').catch(() => {})

    // Assert
    expect(useOnline().isOnline.value).toBe(false)
  })

  it('should mark the app online again once any response arrives, even an error', async () => {
    // Arrange
    setOnline(false)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 404 })))

    // Act
    await api('/activities').catch(() => {})

    // Assert
    expect(useOnline().isOnline.value).toBe(true)
    vi.mocked(Sentry.captureException).mockClear()
  })
})
