import { describe, it, expect, vi } from 'vitest'
import { api } from '../../src/api/client'
import { useAuth } from '../../src/composables/useAuth'

// useAuth uses module-level state (user ref + initPromise). We need to reset
// that state between tests. The simplest way: re-import via vi.importActual
// won't work because the module is cached. Instead, we drive state through
// the public API (login/logout/fetchMe) and control the mock responses.

describe('useAuth', () => {
  it('should set user and isLoggedIn after successful login', async () => {
    // Arrange
    vi.mocked(api).mockResolvedValueOnce({ id: 'u1', email: 'test@example.com' })
    const { login, user, isLoggedIn } = useAuth()

    // Act
    await login('test@example.com', 'password123')

    // Assert
    expect(user.value).toEqual({ id: 'u1', email: 'test@example.com' })
    expect(isLoggedIn.value).toBe(true)
  })

  it('should set user after successful registration', async () => {
    // Arrange
    vi.mocked(api).mockResolvedValueOnce({ id: 'u2', email: 'new@example.com' })
    const { register, user } = useAuth()

    // Act
    await register('new@example.com', 'password123')

    // Assert
    expect(user.value).toEqual({ id: 'u2', email: 'new@example.com' })
    expect(vi.mocked(api)).toHaveBeenCalledWith('/register', expect.objectContaining({
      method: 'POST',
    }))
  })

  it('should identify anonymous users (no email)', async () => {
    // Arrange
    vi.mocked(api).mockResolvedValueOnce({ id: 'u3', email: null })
    const { deviceLogin, isAnonymous, isLoggedIn } = useAuth()

    // Act
    await deviceLogin('device-abc')

    // Assert
    expect(isAnonymous.value).toBe(true)
    expect(isLoggedIn.value).toBe(true)
  })

  it('should clear user state on logout', async () => {
    // Arrange — start logged in
    vi.mocked(api).mockResolvedValueOnce({ id: 'u1', email: 'test@example.com' })
    const { login, logout, user, isLoggedIn } = useAuth()
    await login('test@example.com', 'pass')
    vi.mocked(api).mockResolvedValueOnce(undefined) // logout response

    // Act
    await logout()

    // Assert
    expect(user.value).toBeNull()
    expect(isLoggedIn.value).toBe(false)
  })

  it('should clear user when fetchMe fails (e.g. expired session)', async () => {
    // Arrange — start logged in
    vi.mocked(api).mockResolvedValueOnce({ id: 'u1', email: 'test@example.com' })
    const { login, fetchMe, user } = useAuth()
    await login('test@example.com', 'pass')
    vi.mocked(api).mockRejectedValueOnce(new Error('401'))

    // Act
    await fetchMe()

    // Assert
    expect(user.value).toBeNull()
  })
})
