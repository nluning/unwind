<template>
  <div
    ref="menuRef"
    class="uw-corner-menu"
  >
    <button
      ref="menuBtnRef"
      class="uw-menu-btn"
      :aria-label="$t('menu.label')"
      :aria-expanded="open"
      @click="toggleMenu"
    >
      <MenuLinesIcon />
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-[calc(100%+8px)] w-64 rounded-xl py-2 overflow-hidden backdrop-blur-[8px]"
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
        </div>
      </div>

      <div class="h-px bg-uw-border-soft my-1" />

      <nav :aria-label="$t('menu.label')">
        <template v-for="(group, groupIndex) in menuGroups" :key="groupIndex">
          <div
            v-if="groupIndex > 0"
            class="h-px bg-uw-border-soft my-2 mx-3"
          />
          <section class="px-3 py-1 flex flex-col gap-1">
            <p v-if="group.heading" class="text-xs text-uw-ink-mute px-3 pt-1 pb-1">
              {{ $t(group.heading) }}
            </p>
            <router-link
              v-for="link in group.links"
              :key="link.label"
              :to="link.to"
              class="block w-full py-2 rounded-lg text-sm text-uw-ink-soft no-underline transition-colors hover:text-uw-ink"
              :class="group.heading ? 'pl-6 pr-3' : 'px-3'"
              active-class="!text-uw-ink !font-medium"
              @click="open = false"
            >
              {{ $t(link.label) }}
            </router-link>
          </section>
        </template>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { useTheme, type ColorScheme } from '../composables/useTheme.js'
import { useWelcome } from '../composables/useWelcome.js'
import MenuLinesIcon from './icons/MenuLinesIcon.vue'

const { colorScheme, setColorScheme } = useTheme()
const { dismissMenuHint } = useWelcome()

const open = ref(false)
const menuRef = ref<HTMLElement | null>(null)
const menuBtnRef = ref<HTMLElement | null>(null)

function toggleMenu() {
  open.value = !open.value
  if (open.value) dismissMenuHint()
}

function closeMenu() {
  open.value = false
  menuBtnRef.value?.focus()
}

function handleClickOutside(event: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    open.value = false
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) closeMenu()
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})

const themes: { id: ColorScheme; swatch: string }[] = [
  { id: 'calm',    swatch: '#6d8c94' },
  { id: 'warm',    swatch: '#db8460' },
  { id: 'playful', swatch: '#3d7a4a' },
]

const menuGroups: { heading?: string; links: { to: RouteLocationRaw; label: string }[] }[] = [
  {
    links: [
      { to: '/activities',     label: 'jouwActiviteiten.viewList' },
      { to: '/activities/new', label: 'jouwActiviteiten.selfAdd' },
    ],
  },
  {
    heading: 'menu.aiSuggestions',
    links: [
      { to: '/quick-suggest',     label: 'jouwActiviteiten.quickSuggest' },
      { to: '/suggest-from-list', label: 'jouwActiviteiten.fromList' },
    ],
  },
  {
    links: [
      { to: '/account', label: 'menu.account' },
    ],
  },
]
</script>
