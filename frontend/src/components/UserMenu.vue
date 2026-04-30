<template>
  <div
    ref="menuRef"
    class="fixed top-[18px] right-[22px] z-20"
  >
    <button
      class="uw-menu-btn"
      :aria-label="$t('menu.label')"
      :aria-expanded="open"
      @click="open = !open"
    >
      <MenuDotsIcon />
    </button>

    <div
      v-if="open"
      role="menu"
      class="absolute right-0 top-[calc(100%+8px)] w-56 rounded-xl py-2 overflow-hidden backdrop-blur-[8px]"
      :style="{
        background: 'var(--uw-card, rgba(255,255,255,0.95))',
        boxShadow: '0 10px 30px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.06)',
      }"
    >
      <div class="py-2 px-4">
        <p class="text-xs text-uw-ink-mute mb-2">{{ $t('menu.theme') }}</p>
        <div class="flex items-center gap-2">
          <button
            v-for="preset in themes"
            :key="preset.id"
            class="w-[22px] h-[22px] rounded-[11px] border-2 p-0 cursor-pointer"
            :class="colorScheme === preset.id ? 'border-uw-ink' : 'border-transparent'"
            :style="{ background: preset.swatch }"
            :aria-label="$t(`theme.${preset.id}`)"
            :aria-pressed="colorScheme === preset.id"
            @click="setColorScheme(preset.id)"
          />
          <div class="w-px h-[18px] bg-uw-border-soft mx-1" />
          <button
            class="w-[22px] h-[22px] rounded-[11px] border border-uw-border bg-transparent text-uw-ink-soft inline-flex items-center justify-center p-0 cursor-pointer"
            :aria-label="$t(mode === 'dark' ? 'theme.light' : 'theme.dark')"
            :aria-pressed="mode === 'dark'"
            @click="toggleMode"
          >
            <MoonIcon />
          </button>
        </div>
      </div>

      <div class="h-px bg-uw-border-soft my-1" />

      <router-link
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        class="block w-full py-2.5 px-4 text-sm text-uw-ink-soft text-left no-underline transition-colors hover:text-uw-primary"
        @click="open = false"
      >
        {{ $t(link.label) }}
      </router-link>

      <div class="h-px bg-uw-border-soft my-1" />

      <button
        class="block w-full py-2.5 px-4 text-sm text-left bg-transparent border-0 cursor-pointer transition-opacity hover:opacity-80"
        :style="{ color: 'var(--uw-danger, #b4412a)' }"
        @click="handleLogout"
      >
        {{ $t('menu.logout') }}
      </button>

      <div class="h-px bg-uw-border-soft my-1" />

      <ConfirmDeleteButton
        class="block w-full py-2.5 px-4 text-sm text-left bg-transparent border-0 cursor-pointer"
        :label="$t('menu.deleteAccount')"
        :confirm-label="$t('menu.deleteConfirm')"
        @confirm="handleDeleteAccount"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'
import { useTheme, type ColorScheme } from '../composables/useTheme.js'
import MenuDotsIcon from './icons/MenuDotsIcon.vue'
import MoonIcon from './icons/MoonIcon.vue'
import ConfirmDeleteButton from './ConfirmDeleteButton.vue'

const { logout, deleteAccount } = useAuth()
const { colorScheme, setColorScheme, mode, toggleMode } = useTheme()
const router = useRouter()

const open = ref(false)
const menuRef = ref<HTMLElement | null>(null)

async function handleLogout() {
  open.value = false
  await logout()
  router.push('/login')
}

async function handleDeleteAccount() {
  open.value = false
  await deleteAccount()
  router.push('/login')
}

function handleClickOutside(event: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

const themes: { id: ColorScheme; swatch: string }[] = [
  { id: 'warm',    swatch: '#ae7c6d' },
  { id: 'calm',    swatch: '#6d8c94' },
  { id: 'playful', swatch: '#3d7a4a' },
]

const navLinks = [
  { to: '/stress',         label: 'nav.stress' },
  { to: '/counterbalance', label: 'nav.counterbalance' },
  { to: '/activities',     label: 'activitiesList.link' },
  { to: '/privacy',        label: 'privacy.link' },
]
</script>
