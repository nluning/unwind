<template>
  <PageShell>
      <PageHeader />

      <main class="flex-1 flex flex-col justify-center px-[26px] pb-12 gap-6">
        <h1 class="font-serif text-2xl tracking-tight text-uw-ink m-0">
          {{ headingText }}
        </h1>

        <p
          v-if="mode === 'upgrade'"
          class="text-sm text-uw-ink-soft m-0"
        >
          {{ $t('auth.upgradeIntro') }}
        </p>

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
              :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
              class="px-4 py-3 rounded-xl text-base outline-none bg-uw-accent border border-uw-border-soft text-uw-ink"
            />
          </label>

          <p v-if="error" class="text-uw-danger text-sm" role="alert">{{ error }}</p>

          <button
            type="submit"
            :disabled="loading"
            class="px-5 py-3 rounded-xl text-base cursor-pointer border-none bg-uw-primary text-uw-primary-fg font-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {{ submitText }}
          </button>

          <button
            type="button"
            class="text-sm text-uw-ink-soft bg-transparent border-none cursor-pointer mt-1"
            @click="toggleMode"
          >
            {{ toggleText }}
          </button>
        </form>

        <template v-if="mode !== 'upgrade'">
          <div class="h-px bg-uw-border-soft" />

          <button
            type="button"
            class="px-5 py-3 rounded-xl text-sm cursor-pointer bg-transparent border border-uw-border text-uw-ink-soft font-500 disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="loading"
            @click="handleDeviceAuth"
          >
            {{ $t('auth.deviceButton') }}
          </button>
        </template>

        <router-link
          to="/privacy"
          class="text-xs text-uw-ink-mute no-underline text-center"
        >
          {{ $t('privacy.link') }}
        </router-link>
      </main>
  </PageShell>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth, getOrCreateDeviceId } from '../composables/useAuth.js'
import { ApiError } from '../api/client.js'
import PageShell from '../components/PageShell.vue'
import PageHeader from '../components/PageHeader.vue'

type Mode = 'login' | 'register' | 'upgrade'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { login, register, deviceLogin, upgrade } = useAuth()

// Initial mode comes from the ?mode= query param. The menu's "Maak een
// account" entry routes here with ?mode=upgrade for anonymous users.
const mode = ref<Mode>(route.query.mode === 'upgrade' ? 'upgrade' : 'login')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const headingText = computed(() => {
  if (mode.value === 'upgrade') return t('auth.upgrade')
  if (mode.value === 'register') return t('auth.register')
  return t('auth.login')
})

const submitText = computed(() => {
  if (mode.value === 'upgrade') return t('auth.upgradeButton')
  if (mode.value === 'register') return t('auth.registerButton')
  return t('auth.loginButton')
})

const toggleText = computed(() => {
  // From login → register, otherwise → login. Upgrade users who already
  // have an account toggle to the email-login form.
  return mode.value === 'login'
    ? t('auth.switchToRegister')
    : t('auth.switchToLogin')
})

function toggleMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  error.value = ''
}

async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    if (mode.value === 'upgrade') {
      await upgrade(email.value, password.value)
    } else if (mode.value === 'register') {
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
    await deviceLogin(getOrCreateDeviceId())
    router.push({ name: 'suggest' })
  } catch {
    error.value = t('auth.error')
  } finally {
    loading.value = false
  }
}
</script>
