<template>
  <div class="uw-screen">
    <div class="uw-screen__wash" aria-hidden="true" />
    <div class="uw-screen__glow" aria-hidden="true" />

    <div class="uw-frame">
      <header class="uw-header">
        <span class="uw-wordmark">unwind</span>
      </header>

      <main class="flex-1 flex flex-col justify-center px-[26px] pb-12 gap-6">
        <h1 class="font-serif text-2xl tracking-tight text-uw-ink m-0">
          {{ isRegistering ? $t('auth.register') : $t('auth.login') }}
        </h1>

        <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
          <label class="flex flex-col gap-1.5 text-sm text-uw-ink-soft">
            {{ $t('auth.email') }}
            <input
              v-model="email"
              type="email"
              required
              autocomplete="email"
              class="px-4 py-3 rounded-xl text-base outline-none bg-uw-accent border border-uw-border-soft text-uw-ink"
            />
          </label>

          <label class="flex flex-col gap-1.5 text-sm text-uw-ink-soft">
            {{ $t('auth.password') }}
            <input
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              class="px-4 py-3 rounded-xl text-base outline-none bg-uw-accent border border-uw-border-soft text-uw-ink"
            />
          </label>

          <p v-if="error" class="text-error text-sm" role="alert">{{ error }}</p>

          <button
            type="submit"
            :disabled="loading"
            class="px-5 py-3 rounded-xl text-base cursor-pointer border-none bg-uw-primary text-uw-primary-fg font-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {{ isRegistering ? $t('auth.registerButton') : $t('auth.loginButton') }}
          </button>

          <button
            type="button"
            class="text-sm text-uw-ink-soft bg-transparent border-none cursor-pointer mt-1"
            @click="toggleMode"
          >
            {{ isRegistering ? $t('auth.switchToLogin') : $t('auth.switchToRegister') }}
          </button>
        </form>

        <div class="h-px bg-uw-border-soft" />

        <button
          type="button"
          class="px-5 py-3 rounded-xl text-sm cursor-pointer bg-transparent border border-uw-border text-uw-ink-soft font-500 disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="loading"
          @click="handleDeviceAuth"
        >
          {{ $t('auth.deviceButton') }}
        </button>

        <router-link
          to="/privacy"
          class="text-xs text-uw-ink-mute no-underline text-center"
        >
          {{ $t('privacy.link') }}
        </router-link>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../composables/useAuth.js'
import { ApiError } from '../api/client.js'

const router = useRouter()
const { t } = useI18n()
const { login, register, deviceLogin } = useAuth()

const isRegistering = ref(false)
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

function toggleMode() {
  isRegistering.value = !isRegistering.value
  error.value = ''
}

async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    if (isRegistering.value) {
      await register(email.value, password.value)
    } else {
      await login(email.value, password.value)
    }
    router.push({ name: 'suggest' })
  } catch (err) {
    if (err instanceof ApiError && err.body && typeof err.body === 'object' && 'error' in err.body) {
      error.value = (err.body as { error: string }).error
    } else {
      error.value = t('auth.error')
    }
  } finally {
    loading.value = false
  }
}

async function handleDeviceAuth() {
  error.value = ''
  loading.value = true

  try {
    const deviceId = getOrCreateDeviceId()
    await deviceLogin(deviceId)
    router.push({ name: 'suggest' })
  } catch {
    error.value = t('auth.error')
  } finally {
    loading.value = false
  }
}

function getOrCreateDeviceId(): string {
  const key = 'unwind-device-id'
  let deviceId = localStorage.getItem(key)
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem(key, deviceId)
  }
  return deviceId
}
</script>
