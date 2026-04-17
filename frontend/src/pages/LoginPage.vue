<template>
  <main class="flex flex-col items-center px-4 py-8 max-w-96 mx-auto">
    <h1>{{ $t('app.title') }}</h1>

    <form @submit.prevent="handleSubmit" class="flex flex-col gap-4 w-full">
      <h2>{{ isRegistering ? $t('auth.register') : $t('auth.login') }}</h2>

      <label class="flex flex-col gap-1 text-sm">
        {{ $t('auth.email') }}
        <input
          v-model="email"
          type="email"
          required
          autocomplete="email"
          class="p-3 border border-outline rounded-lg text-base"
        />
      </label>

      <label class="flex flex-col gap-1 text-sm">
        {{ $t('auth.password') }}
        <input
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
          class="p-3 border border-outline rounded-lg text-base"
        />
      </label>

      <p v-if="error" class="text-error text-sm" role="alert">{{ error }}</p>

      <button
        type="submit"
        :disabled="loading"
        class="p-3 bg-primary text-white border-none rounded-lg text-base cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {{ isRegistering ? $t('auth.registerButton') : $t('auth.loginButton') }}
      </button>

      <LinkButton
        class="text-sm"
        @click="isRegistering = !isRegistering; error = ''"
      >
        {{ isRegistering ? $t('auth.switchToLogin') : $t('auth.switchToRegister') }}
      </LinkButton>
    </form>

    <div class="w-full h-px bg-outline my-6"></div>

    <button
      type="button"
      class="py-3 px-6 bg-transparent border border-muted rounded-lg text-sm cursor-pointer text-dim disabled:opacity-60 disabled:cursor-not-allowed"
      :disabled="loading"
      @click="handleDeviceAuth"
    >
      {{ $t('auth.deviceButton') }}
    </button>

    <router-link
      to="/privacy"
      class="text-xs text-muted hover:text-primary transition-colors no-underline mt-4"
    >
      {{ $t('privacy.link') }}
    </router-link>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../composables/useAuth.js'
import { ApiError } from '../api/client.js'
import LinkButton from '../components/LinkButton.vue'

const router = useRouter()
const { t } = useI18n()
const { login, register, deviceLogin } = useAuth()

const isRegistering = ref(false)
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

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
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}
</script>
