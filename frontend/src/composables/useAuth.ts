import { ref, computed } from 'vue'
import * as Sentry from '@sentry/vue'
import { api, NetworkError } from '../api/client.js'
import { resetSuggestionFlowState } from './useSuggestionFlow.js'
import { resetPostActivityFeedback } from './usePostActivityFeedback.js'
import { resetActivitiesState } from './useActivities.js'
import { resetMemoriesState } from './useMemories.js'
import { clearLocalData } from '../utils/localDb.js'

interface User {
  id: string
  email: string | null
  onboarding_completed_at: string | null
  memory_enabled: boolean
}

const user = ref<User | null>(null)
let initPromise: Promise<void> | null = null

const DEVICE_ID_KEY = 'unwind-device-id'

const EXPLICIT_LOGOUT_KEY = 'unwind-explicit-logout'

export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }
  return deviceId
}

export function isExplicitlyLoggedOut(): boolean {
  return !!localStorage.getItem(EXPLICIT_LOGOUT_KEY)
}

// Logout and account deletion must leave nothing of the user on the device
// (shared phones). A failed wipe must not block the logout itself; the owner tag
// on the snapshot still stops it being shown to a different user.
async function wipeLocalData() {
  try {
    await clearLocalData()
  } catch {
    // storage unavailable: nothing was stored
  }
}

function setSentryUser(authedUser: User | null) {
  Sentry.setUser(authedUser ? { id: authedUser.id } : null)
}

export function useAuth() {
  const isLoggedIn = computed(() => user.value !== null)
  const isAnonymous = computed(() => user.value !== null && user.value.email === null)

  async function fetchMe() {
    try {
      user.value = await api<User>('/me')
      localStorage.setItem('unwind-user', 'true')
      setSentryUser(user.value)
    } catch {
      if (localStorage.getItem(EXPLICIT_LOGOUT_KEY)) {
        user.value = null
        localStorage.removeItem('unwind-user')
        setSentryUser(null)
        return
      }
      // NOTE: also fires when an email user's session expires, silently
      // dropping them into a fresh anonymous account. Separate concern from
      // the upgrade/device-id fix — left as-is for now.
      try {
        await deviceLogin(getOrCreateDeviceId())
      } catch {
        user.value = null
        localStorage.removeItem('unwind-user')
        setSentryUser(null)
      }
    }
  }

  function initialize(): Promise<void> {
    if (!initPromise) {
      initPromise = fetchMe()
    }
    return initPromise
  }

  async function login(email: string, password: string) {
    resetActivitiesState()
    resetSuggestionFlowState()
    user.value = await api<User>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    localStorage.setItem('unwind-user', 'true')
    localStorage.removeItem(EXPLICIT_LOGOUT_KEY)
    setSentryUser(user.value)
  }

  async function register(email: string, password: string) {
    resetActivitiesState()
    resetSuggestionFlowState()
    user.value = await api<User>('/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    localStorage.setItem('unwind-user', 'true')
    localStorage.removeItem(EXPLICIT_LOGOUT_KEY)
    setSentryUser(user.value)
  }

  async function deviceLogin(deviceId: string) {
    resetActivitiesState()
    resetSuggestionFlowState()
    user.value = await api<User>('/auth/device', {
      method: 'POST',
      body: JSON.stringify({ device_id: deviceId }),
    })
    localStorage.setItem('unwind-user', 'true')
    localStorage.removeItem(EXPLICIT_LOGOUT_KEY)
    setSentryUser(user.value)
  }

  async function upgrade(email: string, password: string) {
    const result = await api<User>('/auth/upgrade', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    user.value = result
    localStorage.removeItem(DEVICE_ID_KEY)
  }

  async function setMemoryEnabled(enabled: boolean) {
    const result = await api<{ memory_enabled: boolean }>('/me', {
      method: 'PATCH',
      body: JSON.stringify({ memory_enabled: enabled }),
    })
    if (user.value) {
      user.value = { ...user.value, memory_enabled: result.memory_enabled }
    }
    if (!result.memory_enabled) {
      // Backend wiped user_memories; mirror that locally so any page
      // already showing the list doesn't lag behind the server.
      resetMemoriesState()
    }
  }

  async function logout() {
    // Logging out must work offline, or on a shared phone "log out" would leave
    // the data on screen. The server call is best-effort: offline we can't revoke
    // the session cookie, which then lives until it expires. Real server errors
    // still surface.
    try {
      await api('/logout', { method: 'POST' })
    } catch (logoutFailure) {
      if (!(logoutFailure instanceof NetworkError)) throw logoutFailure
    }
    user.value = null
    localStorage.removeItem('unwind-user')
    localStorage.setItem(EXPLICIT_LOGOUT_KEY, '1')
    setSentryUser(null)
    resetSuggestionFlowState()
    resetPostActivityFeedback()
    resetActivitiesState()
    resetMemoriesState()
    await wipeLocalData()
  }

  async function deleteAccount() {
    await api('/me', { method: 'DELETE' })
    user.value = null
    localStorage.removeItem('unwind-user')
    setSentryUser(null)
    resetSuggestionFlowState()
    resetPostActivityFeedback()
    resetActivitiesState()
    resetMemoriesState()
    await wipeLocalData()
  }

  return {
    user,
    isLoggedIn,
    isAnonymous,
    initialize,
    fetchMe,
    login,
    register,
    deviceLogin,
    upgrade,
    setMemoryEnabled,
    logout,
    deleteAccount,
  }
}
