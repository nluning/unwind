<template>
  <div class="relative" ref="menuRef">
    <button
      class="w-11 h-11 rounded-full bg-card border border-outline flex items-center justify-center cursor-pointer"
      :aria-label="$t('menu.label')"
      :aria-expanded="open"
      @click="open = !open"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="18" x2="20" y2="18" />
      </svg>
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-13 w-56 bg-card border border-outline rounded-xl shadow-lg py-2 z-20"
    >
      <!-- Theme selector -->
      <div class="px-4 py-2">
        <p class="text-xs text-muted mb-2">{{ $t('menu.theme') }}</p>
        <ThemeSelector />
      </div>

      <div class="border-t border-outline my-1" />

      <!-- Navigation links -->
      <router-link
        :to="'/stress'"
        class="block px-4 py-2.5 text-sm text-dim hover:text-primary transition-colors no-underline"
        @click="open = false"
      >
        {{ $t('nav.stress') }}
      </router-link>
      <router-link
        :to="'/counterbalance'"
        class="block px-4 py-2.5 text-sm text-dim hover:text-primary transition-colors no-underline"
        @click="open = false"
      >
        {{ $t('nav.counterbalance') }}
      </router-link>

      <div class="border-t border-outline my-1" />

      <!-- Logout -->
      <button
        class="w-full text-left px-4 py-2.5 text-sm text-error cursor-pointer bg-transparent border-none hover:opacity-80"
        @click="handleLogout"
      >
        {{ $t('menu.logout') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'
import ThemeSelector from './ThemeSelector.vue'

const { logout } = useAuth()
const router = useRouter()

const open = ref(false)
const menuRef = ref<HTMLElement | null>(null)

async function handleLogout() {
  open.value = false
  await logout()
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
</script>
