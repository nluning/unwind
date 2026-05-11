import { ref, computed } from 'vue'
import { api } from '../api/client.js'
import { resetSuggestionFlowState } from './useSuggestionFlow.js'
import { resetActivitiesState } from './useActivities.js'

interface User {
  id: string
  email: string | null
  onboarding_completed_at: string | null
}

const user = ref<User | null>(null)
let initPromise: Promise<void> | null = null

export function useAuth() {
  const isLoggedIn = computed(() => user.value !== null)
  const isAnonymous = computed(() => user.value !== null && user.value.email === null)
  // Falsy check (not `=== null`) so a missing field also counts as "needs
  // onboarding" — the safer default if any future auth path forgets to
  // include onboarding_completed_at in the response.
  const needsOnboarding = computed(
    () => user.value !== null && !user.value.onboarding_completed_at
  )

  async function fetchMe() {
    try {
      user.value = await api<User>('/me')
      localStorage.setItem('unwind-user', 'true')
      // TODO (plan/16-onboarding-user-scope.md, Phase 2.4): clean up the
      // legacy browser-scoped onboarding flag from users' localStorage:
      //   localStorage.removeItem('unwind-onboarding-done')
      // Keep for one release cycle after deploy, then delete this TODO.
    } catch {
      user.value = null
      localStorage.removeItem('unwind-user')
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
  }

  async function register(email: string, password: string) {
    resetActivitiesState()
    resetSuggestionFlowState()
    user.value = await api<User>('/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    localStorage.setItem('unwind-user', 'true')
  }

  async function deviceLogin(deviceId: string) {
    resetActivitiesState()
    resetSuggestionFlowState()
    user.value = await api<User>('/auth/device', {
      method: 'POST',
      body: JSON.stringify({ device_id: deviceId }),
    })
    localStorage.setItem('unwind-user', 'true')
  }

  async function logout() {
    await api('/logout', { method: 'POST' })
    user.value = null
    localStorage.removeItem('unwind-user')
    resetSuggestionFlowState()
    resetActivitiesState()
  }

  async function deleteAccount() {
    await api('/me', { method: 'DELETE' })
    user.value = null
    localStorage.removeItem('unwind-user')
    resetSuggestionFlowState()
    resetActivitiesState()
  }

  return {
    user,
    isLoggedIn,
    isAnonymous,
    needsOnboarding,
    initialize,
    fetchMe,
    login,
    register,
    deviceLogin,
    logout,
    deleteAccount,
  }
}
