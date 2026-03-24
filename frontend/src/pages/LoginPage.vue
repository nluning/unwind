<template>
  <main class="auth-page">
    <h1>{{ $t('app.title') }}</h1>

    <form @submit.prevent="handleSubmit" class="auth-form">
      <h2>{{ isRegistering ? $t('auth.register') : $t('auth.login') }}</h2>

      <label>
        {{ $t('auth.email') }}
        <input
          v-model="email"
          type="email"
          required
          autocomplete="email"
        />
      </label>

      <label>
        {{ $t('auth.password') }}
        <input
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
        />
      </label>

      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <button type="submit" :disabled="loading">
        {{ isRegistering ? $t('auth.registerButton') : $t('auth.loginButton') }}
      </button>

      <button
        type="button"
        class="link-button"
        @click="isRegistering = !isRegistering; error = ''"
      >
        {{ isRegistering ? $t('auth.switchToLogin') : $t('auth.switchToRegister') }}
      </button>
    </form>

    <div class="divider"></div>

    <button
      type="button"
      class="device-button"
      :disabled="loading"
      @click="handleDeviceAuth"
    >
      {{ $t('auth.deviceButton') }}
    </button>
  </main>
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

<style scoped>
.auth-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  max-width: 24rem;
  margin: 0 auto;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
}

input {
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  font-size: 1rem;
}

button[type="submit"] {
  padding: 0.75rem;
  background: #2c6e49;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
}

button[type="submit"]:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.link-button {
  background: none;
  border: none;
  color: #2c6e49;
  cursor: pointer;
  font-size: 0.875rem;
  text-decoration: underline;
  padding: 0;
}

.divider {
  width: 100%;
  height: 1px;
  background: #ddd;
  margin: 1.5rem 0;
}

.device-button {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 1px solid #999;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  color: #555;
}

.device-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #c0392b;
  font-size: 0.875rem;
  margin: 0;
}
</style>
