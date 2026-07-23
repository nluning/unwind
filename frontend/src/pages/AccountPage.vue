<template>
  <PageShell>
    <PageHeader />

    <main class="flex flex-col px-[26px] py-6 gap-8">
      <h1 class="font-serif text-2xl tracking-tight text-uw-ink m-0">
        {{ $t('account.heading') }}
      </h1>

      <!-- Auth / email section -->
      <section class="flex flex-col gap-3">
        <h2 class="font-serif text-lg text-uw-ink m-0">
          {{ $t('account.emailSectionHeading') }}
        </h2>

        <template v-if="user?.email">
          <p class="text-xs text-uw-ink-mute m-0">{{ $t('account.emailLabel') }}</p>
          <p class="text-base text-uw-ink m-0">{{ user.email }}</p>
        </template>

        <template v-else>
          <p class="text-sm text-uw-ink m-0">{{ $t('account.anonymousLabel') }}</p>
          <p class="text-sm text-uw-ink-soft m-0">{{ $t('account.anonymousHint') }}</p>
          <button
            type="button"
            class="self-start px-5 py-3 rounded-xl text-base cursor-pointer border-none bg-uw-primary text-uw-primary-fg font-medium"
            @click="router.push('/login?mode=upgrade')"
          >
            {{ $t('account.createAccount') }}
          </button>
        </template>
      </section>

      <!-- Memory section -->
      <section class="flex flex-col gap-3">
        <h2 class="font-serif text-lg text-uw-ink m-0">
          {{ $t('account.memorySectionHeading') }}
        </h2>

        <p class="text-sm text-uw-ink-soft m-0">{{ $t('account.memorySectionIntro') }}</p>

        <div class="flex items-center justify-between gap-3">
          <span class="text-sm text-uw-ink">{{ $t('account.memoryEnabledLabel') }}</span>

          <button
            type="button"
            role="switch"
            :aria-checked="memoryEnabled"
            class="uw-toggle"
            :class="{ 'uw-toggle--on': memoryEnabled }"
            :disabled="toggleBusy"
            @click="handleToggleClick"
          >
            <span class="uw-toggle__thumb" />
          </button>
        </div>

        <!-- Inline destructive confirm -->
        <div
          v-if="confirmDisable"
          class="flex flex-col gap-2 rounded-xl border border-uw-border-soft bg-uw-chip px-4 py-3"
        >
          <p class="text-sm text-uw-ink m-0">{{ $t('account.memoryDisableWarning') }}</p>
          <div class="flex items-center gap-4 self-end">
            <button
              type="button"
              class="uw-text-button"
              :disabled="toggleBusy"
              @click="confirmDisable = false"
            >
              {{ $t('account.memoryDisableCancel') }}
            </button>
            <button
              type="button"
              class="uw-text-button"
              :style="{ color: 'var(--uw-danger, #b4412a)' }"
              :disabled="toggleBusy"
              @click="confirmDisableMemory"
            >
              {{ $t('account.memoryDisableConfirm') }}
            </button>
          </div>
        </div>

        <template v-if="memoryEnabled">
          <StateLoading v-if="!loaded && !error" />
          <StateError v-else-if="error" @retry="fetchMemories()" />

          <template v-else>
            <ul
              v-if="memories.length > 0"
              class="flex flex-col gap-2 m-0 p-0 list-none"
            >
              <li
                v-for="memory in memories"
                :key="memory.id"
                class="flex items-start justify-between gap-3 rounded-xl border border-uw-border-soft bg-uw-chip px-4 py-3"
              >
                <p class="text-sm text-uw-ink m-0 flex-1">{{ memory.fact }}</p>
                <ConfirmDeleteButton
                  class="uw-text-button text-sm shrink-0"
                  :label="$t('account.memoryDeleteButton')"
                  :confirm-label="$t('account.memoryDeleteConfirm')"
                  @confirm="handleDelete(memory.id)"
                />
              </li>
            </ul>

            <p
              v-else
              class="text-sm text-uw-ink-mute m-0"
            >
              {{ $t('account.memoryEmpty') }}
            </p>

            <form
              class="flex flex-col gap-2"
              @submit.prevent="handleAdd"
            >
              <textarea
                v-model="newMemory"
                :placeholder="$t('account.memoryAddPlaceholder')"
                rows="2"
                maxlength="500"
                class="uw-input resize-none"
              />
              <p class="text-sm text-uw-ink-mute m-0">
                {{ $t('account.memoryAddExamples') }}
              </p>
              <p
                v-if="addError"
                class="text-sm m-0"
                :style="{ color: 'var(--uw-danger, #b4412a)' }"
              >
                {{ $t(addError) }}
              </p>
              <button
                type="submit"
                class="self-end px-5 py-3 rounded-xl text-base cursor-pointer border-none bg-uw-primary text-uw-primary-fg font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                :disabled="adding || !newMemory.trim()"
              >
                {{ $t('account.memoryAddButton') }}
              </button>
            </form>
          </template>
        </template>

        <p
          v-else
          class="text-sm text-uw-ink-mute m-0"
        >
          {{ $t('account.memoryDisabled') }}
        </p>
      </section>

      <!-- Danger zone -->
      <section class="flex flex-col gap-3 pt-2">
        <h2 class="font-serif text-lg text-uw-ink m-0">
          {{ $t('account.dangerSectionHeading') }}
        </h2>

        <button
          v-if="user?.email"
          type="button"
          class="self-start uw-text-button"
          @click="handleLogout"
        >
          {{ $t('account.logout') }}
        </button>

        <ConfirmDeleteButton
          class="self-start uw-text-button"
          :label="$t('account.deleteAccount')"
          :confirm-label="$t('account.deleteConfirm')"
          @confirm="handleDeleteAccount"
        />
      </section>

      <!-- Privacy lives here now (out of the menu, report 009) — a quiet footer link. -->
      <router-link
        to="/privacy"
        class="self-start text-sm text-uw-ink-mute no-underline transition-colors hover:text-uw-ink-soft"
      >
        {{ $t('privacy.link') }}
      </router-link>
    </main>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'
import { useMemories } from '../composables/useMemories.js'
import PageShell from '../components/PageShell.vue'
import PageHeader from '../components/PageHeader.vue'
import ConfirmDeleteButton from '../components/ConfirmDeleteButton.vue'
import StateLoading from '../components/StateLoading.vue'
import StateError from '../components/StateError.vue'

const router = useRouter()
const { user, fetchMe, setMemoryEnabled, logout, deleteAccount } = useAuth()
const {
  memories,
  loaded,
  error,
  fetchMemories,
  addMemory,
  deleteMemory,
} = useMemories()

const memoryEnabled = computed(() => user.value?.memory_enabled ?? false)

const confirmDisable = ref(false)
const toggleBusy = ref(false)
const newMemory = ref('')
const adding = ref(false)
const addError = ref('')

onMounted(async () => {
  // Refresh /me so the toggle and memory list reflect server truth
  // (e.g. after onboarding flipped memory_enabled in another flow).
  // The module-level `user` ref otherwise keeps whatever state was
  // loaded at app boot.
  await fetchMe()
  if (memoryEnabled.value) {
    await fetchMemories()
  }
})

async function handleToggleClick() {
  if (toggleBusy.value) return
  if (memoryEnabled.value) {
    // Disabling is destructive — open the inline confirm.
    confirmDisable.value = true
    return
  }
  toggleBusy.value = true
  try {
    await setMemoryEnabled(true)
    await fetchMemories()
  } finally {
    toggleBusy.value = false
  }
}

async function confirmDisableMemory() {
  toggleBusy.value = true
  try {
    await setMemoryEnabled(false)
    confirmDisable.value = false
  } finally {
    toggleBusy.value = false
  }
}

async function handleAdd() {
  const trimmed = newMemory.value.trim()
  if (!trimmed) return
  adding.value = true
  addError.value = ''
  try {
    await addMemory(trimmed)
    newMemory.value = ''
  } catch {
    addError.value = 'account.memoryAddError'
  } finally {
    adding.value = false
  }
}

async function handleDelete(memoryId: string) {
  try {
    await deleteMemory(memoryId)
  } catch {
    await fetchMemories()
  }
}

async function handleLogout() {
  await logout()
  router.push('/login')
}

async function handleDeleteAccount() {
  await deleteAccount()
  router.push('/login')
}
</script>

<style scoped>
.uw-toggle {
  position: relative;
  display: inline-flex;
  width: 44px;
  height: 26px;
  padding: 0;
  border-radius: 999px;
  border: 1px solid var(--uw-border);
  background: var(--uw-chip);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}
.uw-toggle:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.uw-toggle--on {
  background: var(--uw-primary);
  border-color: transparent;
}
.uw-toggle__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--uw-card, #fff);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  transition: transform 0.15s ease;
}
.uw-toggle--on .uw-toggle__thumb {
  transform: translateX(18px);
}
</style>
