import { ref, computed } from 'vue'
import { api } from '../api/client.js'
import { resetSuggestionFlowState } from './useSuggestionFlow.js'

interface User {
  id: string
  email: string | null
}

const user = ref<User | null>(null)
let initPromise: Promise<void> | null = null

export function useAuth() {
  const isLoggedIn = computed(() => user.value !== null)
  const isAnonymous = computed(() => user.value !== null && user.value.email === null)

  async function fetchMe() {
    try {
      user.value = await api<User>('/me')
      localStorage.setItem('unwind-user', 'true')
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
    user.value = await api<User>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    localStorage.setItem('unwind-user', 'true')
  }

  async function register(email: string, password: string) {
    user.value = await api<User>('/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    localStorage.setItem('unwind-user', 'true')
  }

  async function deviceLogin(deviceId: string) {
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
  }

  async function deleteAccount() {
    await api('/me', { method: 'DELETE' })
    user.value = null
    localStorage.removeItem('unwind-user')
    resetSuggestionFlowState()
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
    logout,
    deleteAccount,
  }
}
