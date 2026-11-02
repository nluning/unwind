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

// Logout and deletion must leave nothing on the device (shared phones). A failed
// wipe must not block logout; the owner tag still keeps the snapshot from other users.
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

// Lets the app boot with no signal: the server stays authoritative, this is only
// the last session it confirmed. Removed on logout, deletion and a 401.
const CACHED_USER_KEY = 'unwind-cached-user'

function cacheUser(authedUser: User) {
  localStorage.setItem(CACHED_USER_KEY, JSON.stringify(authedUser))
}

function readCachedUser(): User | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHED_USER_KEY) ?? 'null')
    return typeof parsed?.id === 'string' ? (parsed as User) : null
  } catch {
    return null
  }
}

function rememberSession(authedUser: User) {
  user.value = authedUser
  localStorage.setItem('unwind-user', 'true')
  cacheUser(authedUser)
  setSentryUser(authedUser)
}

function forgetSession() {
  user.value = null
  localStorage.removeItem('unwind-user')
  localStorage.removeItem(CACHED_USER_KEY)
  setSentryUser(null)
}

export function useAuth() {
  const isLoggedIn = computed(() => user.value !== null)
  const isAnonymous = computed(() => user.value !== null && user.value.email === null)

  async function fetchMe() {
    try {
      rememberSession(await api<User>('/me'))
    } catch (fetchFailure) {
      if (localStorage.getItem(EXPLICIT_LOGOUT_KEY)) {
        forgetSession()
        return
      }
      // No answer is not "no session": a device login would fail too and wrongly end
      // it. Trust the last confirmed session; the first 401 triggers re-auth.
      if (fetchFailure instanceof NetworkError) {
        const cachedUser = readCachedUser()
        if (cachedUser && localStorage.getItem('unwind-user')) {
          user.value = cachedUser
          setSentryUser(cachedUser)
        }
        return
      }
      // NOTE: also fires when an email user's session expires, silently
      // dropping them into a fresh anonymous account. Separate concern from
      // the upgrade/device-id fix — left as-is for now.
      try {
        await deviceLogin(getOrCreateDeviceId())
      } catch {
        forgetSession()
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
    rememberSession(
      await api<User>('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    )
    localStorage.removeItem(EXPLICIT_LOGOUT_KEY)
  }

  async function register(email: string, password: string) {
    resetActivitiesState()
    resetSuggestionFlowState()
    rememberSession(
      await api<User>('/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    )
    localStorage.removeItem(EXPLICIT_LOGOUT_KEY)
  }

  async function deviceLogin(deviceId: string) {
    resetActivitiesState()
    resetSuggestionFlowState()
    rememberSession(
      await api<User>('/auth/device', {
        method: 'POST',
        body: JSON.stringify({ device_id: deviceId }),
      }),
    )
    localStorage.removeItem(EXPLICIT_LOGOUT_KEY)
  }

  async function upgrade(email: string, password: string) {
    const result = await api<User>('/auth/upgrade', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    user.value = result
    cacheUser(result)
    localStorage.removeItem(DEVICE_ID_KEY)
  }

  async function setMemoryEnabled(enabled: boolean) {
    const result = await api<{ memory_enabled: boolean }>('/me', {
      method: 'PATCH',
      body: JSON.stringify({ memory_enabled: enabled }),
    })
    if (user.value) {
      user.value = { ...user.value, memory_enabled: result.memory_enabled }
      cacheUser(user.value)
    }
    if (!result.memory_enabled) {
      // Backend wiped user_memories; mirror that locally so any page
      // already showing the list doesn't lag behind the server.
      resetMemoriesState()
    }
  }

  async function logout() {
    // Logout must work offline. The server call is best-effort: offline the session
    // cookie can't be revoked and lives until it expires. Real server errors still surface.
    try {
      await api('/logout', { method: 'POST' })
    } catch (logoutFailure) {
      if (!(logoutFailure instanceof NetworkError)) throw logoutFailure
    }
    forgetSession()
    localStorage.setItem(EXPLICIT_LOGOUT_KEY, '1')
    resetSuggestionFlowState()
    resetPostActivityFeedback()
    resetActivitiesState()
    resetMemoriesState()
    await wipeLocalData()
  }

  async function deleteAccount() {
    await api('/me', { method: 'DELETE' })
    forgetSession()
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
