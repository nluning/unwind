import { describe, it, expect, vi } from 'vitest'
import { api } from '../../src/api/client'
import {
  useAuth,
  getOrCreateDeviceId,
  isExplicitlyLoggedOut,
} from '../../src/composables/useAuth'

vi.mock('@sentry/vue', () => ({ setUser: vi.fn() }))
vi.mock('../../src/composables/useSuggestionFlow', () => ({ resetSuggestionFlowState: vi.fn() }))
vi.mock('../../src/composables/useActivities', () => ({ resetActivitiesState: vi.fn() }))
vi.mock('../../src/composables/useMemories', () => ({ resetMemoriesState: vi.fn() }))

function reset() {
  const { user } = useAuth()
  user.value = null
  localStorage.clear()
  vi.mocked(api).mockReset()
}

describe('useAuth', () => {
  describe('useAuth', () => {
    it('should log a registered user in, shaping the request and flagging them onboarded', async () => {
      // Arrange
      reset()
      vi.mocked(api).mockResolvedValueOnce({
        id: 'u1',
        email: 'a@b.nl',
        onboarding_completed_at: '2026-01-01',
        memory_enabled: false,
      })
      const { user, isLoggedIn, isAnonymous, needsOnboarding, login } = useAuth()

      // Act
      await login('a@b.nl', 'secret')

      // Assert
      expect(api).toHaveBeenCalledWith('/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.nl', password: 'secret' }),
      })
      expect(user.value?.id).toBe('u1')
      expect(isLoggedIn.value).toBe(true)
      expect(isAnonymous.value).toBe(false)
      expect(needsOnboarding.value).toBe(false)
      expect(localStorage.getItem('unwind-user')).toBe('true')
    })

    it('should register a new user, shaping the request', async () => {
      // Arrange
      reset()
      vi.mocked(api).mockResolvedValueOnce({
        id: 'r1',
        email: 'new@b.nl',
        onboarding_completed_at: null,
        memory_enabled: false,
      })
      const { user, register } = useAuth()

      // Act
      await register('new@b.nl', 'secret')

      // Assert
      expect(api).toHaveBeenCalledWith('/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'new@b.nl', password: 'secret' }),
      })
      expect(user.value?.id).toBe('r1')
    })

    it('should treat a fetched email-less user as anonymous and needing onboarding', async () => {
      // Arrange
      reset()
      vi.mocked(api).mockResolvedValueOnce({
        id: 'u2',
        email: null,
        onboarding_completed_at: null,
        memory_enabled: false,
      })
      const { user, isAnonymous, needsOnboarding, fetchMe } = useAuth()

      // Act
      await fetchMe()

      // Assert
      expect(user.value?.id).toBe('u2')
      expect(isAnonymous.value).toBe(true)
      expect(needsOnboarding.value).toBe(true)
      expect(localStorage.getItem('unwind-user')).toBe('true')
    })

    it('should fall back to an anonymous device login when fetching the session fails', async () => {
      // Arrange
      reset()
      vi.mocked(api).mockRejectedValueOnce(new Error('401'))
      vi.mocked(api).mockResolvedValueOnce({
        id: 'dev1',
        email: null,
        onboarding_completed_at: null,
        memory_enabled: false,
      })
      const { user, fetchMe } = useAuth()

      // Act
      await fetchMe()

      // Assert
      expect(api).toHaveBeenNthCalledWith(2, '/auth/device', expect.objectContaining({ method: 'POST' }))
      expect(user.value?.id).toBe('dev1')
    })

    it('should stay logged out after a failed fetch when the user logged out explicitly', async () => {
      // Arrange
      reset()
      localStorage.setItem('unwind-explicit-logout', '1')
      localStorage.setItem('unwind-user', 'true')
      vi.mocked(api).mockRejectedValueOnce(new Error('401'))
      const { user, fetchMe } = useAuth()

      // Act
      await fetchMe()

      // Assert
      expect(api).toHaveBeenCalledTimes(1)
      expect(user.value).toBeNull()
      expect(localStorage.getItem('unwind-user')).toBeNull()
    })

    it('should clear the user when both the fetch and device fallback fail', async () => {
      // Arrange
      reset()
      vi.mocked(api).mockRejectedValueOnce(new Error('401'))
      vi.mocked(api).mockRejectedValueOnce(new Error('500'))
      const { user, fetchMe } = useAuth()

      // Act
      await fetchMe()

      // Assert
      expect(user.value).toBeNull()
      expect(localStorage.getItem('unwind-user')).toBeNull()
    })

    it('should upgrade an anonymous account and drop the device id', async () => {
      // Arrange
      reset()
      localStorage.setItem('unwind-device-id', 'dev-xyz')
      vi.mocked(api).mockResolvedValueOnce({
        id: 'anon',
        email: 'up@b.nl',
        onboarding_completed_at: null,
        memory_enabled: false,
      })
      const { user, upgrade } = useAuth()

      // Act
      await upgrade('up@b.nl', 'secret')

      // Assert
      expect(api).toHaveBeenCalledWith('/auth/upgrade', {
        method: 'POST',
        body: JSON.stringify({ email: 'up@b.nl', password: 'secret' }),
      })
      expect(user.value?.email).toBe('up@b.nl')
      expect(localStorage.getItem('unwind-device-id')).toBeNull()
    })

    it('should disable memory on the current user and wipe local memories', async () => {
      // Arrange
      reset()
      const { user, setMemoryEnabled } = useAuth()
      user.value = {
        id: 'u3',
        email: 'a@b.nl',
        onboarding_completed_at: '2026-01-01',
        memory_enabled: true,
      }
      vi.mocked(api).mockResolvedValueOnce({ memory_enabled: false })

      // Act
      await setMemoryEnabled(false)

      // Assert
      expect(api).toHaveBeenCalledWith('/me', {
        method: 'PATCH',
        body: JSON.stringify({ memory_enabled: false }),
      })
      expect(user.value?.memory_enabled).toBe(false)
    })

    it('should clear the session and mark an explicit logout', async () => {
      // Arrange
      reset()
      const { user, isLoggedIn, logout } = useAuth()
      user.value = {
        id: 'u4',
        email: 'a@b.nl',
        onboarding_completed_at: '2026-01-01',
        memory_enabled: false,
      }
      localStorage.setItem('unwind-user', 'true')
      vi.mocked(api).mockResolvedValueOnce(undefined)

      // Act
      await logout()

      // Assert
      expect(api).toHaveBeenCalledWith('/logout', { method: 'POST' })
      expect(user.value).toBeNull()
      expect(isLoggedIn.value).toBe(false)
      expect(localStorage.getItem('unwind-user')).toBeNull()
      expect(isExplicitlyLoggedOut()).toBe(true)
    })

    it('should clear the session when the account is deleted', async () => {
      // Arrange
      reset()
      const { user, deleteAccount } = useAuth()
      user.value = {
        id: 'u5',
        email: 'a@b.nl',
        onboarding_completed_at: '2026-01-01',
        memory_enabled: false,
      }
      localStorage.setItem('unwind-user', 'true')
      vi.mocked(api).mockResolvedValueOnce(undefined)

      // Act
      await deleteAccount()

      // Assert
      expect(api).toHaveBeenCalledWith('/me', { method: 'DELETE' })
      expect(user.value).toBeNull()
      expect(localStorage.getItem('unwind-user')).toBeNull()
    })
  })

  describe('getOrCreateDeviceId', () => {
    it('should create a device id once and reuse it thereafter', () => {
      // Arrange
      localStorage.clear()

      // Act
      const first = getOrCreateDeviceId()
      const second = getOrCreateDeviceId()

      // Assert
      expect(first).toBe(second)
      expect(localStorage.getItem('unwind-device-id')).toBe(first)
    })
  })
})
