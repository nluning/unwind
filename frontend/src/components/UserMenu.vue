<template>
  <div
    ref="menuRef"
    class="fixed top-[18px] right-[22px] z-20"
  >
    <button
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
          <template v-if="enableLightMode">
            <div class="w-px h-[18px] bg-uw-border-soft mx-1" />
            <button
              class="w-[22px] h-[22px] rounded-[11px] border border-uw-border bg-transparent text-uw-ink-soft inline-flex items-center justify-center p-0 cursor-pointer"
              :aria-label="$t(mode === 'dark' ? 'theme.light' : 'theme.dark')"
              :aria-pressed="mode === 'dark'"
              @click="toggleMode"
            >
              <MoonIcon />
            </button>
          </template>
        </div>
      </div>

      <div class="h-px bg-uw-border-soft my-1" />

      <nav :aria-label="$t('menu.label')">
        <!-- Verras me is the sole ontdekkingsroute now (plan 20 §1), so this
             section carries no group header — there's nothing to choose between. -->
        <section class="px-3 pt-2 pb-2">
          <div class="flex flex-col gap-1">
            <router-link
              to="/suggest"
              class="block w-full px-3 py-2.5 rounded-xl text-sm text-uw-ink-soft bg-uw-chip no-underline transition-colors hover:text-uw-ink"
              active-class="!bg-uw-accent !text-uw-ink !font-medium"
              @click="open = false"
            >
              {{ $t('nav.suggest') }}
            </router-link>
          </div>
        </section>

        <section class="px-3 pt-1">
          <h3 class="text-xs font-normal text-uw-ink-mute px-1 mb-1">{{ $t('jouwActiviteiten.group') }}</h3>
          <template v-for="link in jouwActiviteitenLinks" :key="link.label">
            <!-- The two AI routes (Q&A, analyse-fit) don't have pages yet — they
                 land in Phase 4/5. Until then they render as disabled placeholders
                 so the final menu shape is visible without shipping dead links. -->
            <span
              v-if="link.disabled"
              class="block w-full px-3 py-2 rounded-lg text-sm text-uw-ink-mute opacity-50 cursor-not-allowed select-none"
              aria-disabled="true"
            >
              {{ $t(link.label) }}
            </span>
            <router-link
              v-else
              :to="link.to"
              class="block w-full px-3 py-2 rounded-lg text-sm text-uw-ink-soft no-underline transition-colors hover:text-uw-ink"
              active-class="!text-uw-ink !font-medium"
              @click="open = false"
            >
              {{ $t(link.label) }}
            </router-link>
          </template>
        </section>

        <div class="h-px bg-uw-border-soft my-2 mx-3" />

        <section class="px-3 pb-2">
          <h3 class="text-xs font-normal text-uw-ink-mute px-1 mb-1">{{ $t('menu.groupAccount') }}</h3>
          <router-link
            to="/account"
            class="block w-full px-3 py-2 rounded-lg text-sm text-uw-ink-soft no-underline transition-colors hover:text-uw-ink"
            active-class="!text-uw-ink !font-medium"
            @click="open = false"
          >
            {{ $t('menu.account') }}
          </router-link>
          <router-link
            to="/privacy"
            class="block w-full px-3 py-2 rounded-lg text-sm text-uw-ink-soft no-underline transition-colors hover:text-uw-ink"
            active-class="!text-uw-ink !font-medium"
            @click="open = false"
          >
            {{ $t('privacy.link') }}
          </router-link>
        </section>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useTheme, type ColorScheme } from '../composables/useTheme.js'
import { useWelcome } from '../composables/useWelcome.js'
import MenuLinesIcon from './icons/MenuLinesIcon.vue'
import MoonIcon from './icons/MoonIcon.vue'

const { colorScheme, setColorScheme, mode, toggleMode } = useTheme()
const { dismissMenuHint } = useWelcome()

// Flip to true once light-mode `--uw-*` overrides exist in base.css.
const enableLightMode = false

const open = ref(false)
const menuRef = ref<HTMLElement | null>(null)

function toggleMenu() {
  open.value = !open.value
  if (open.value) dismissMenuHint()
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

// The three add-options under "Jouw activiteiten" (plan 20 §2). The tappable
// Q&A route is a disabled placeholder until its page ships (Phase 5) — flip
// `disabled` off and set a real `to` when it lands.
const jouwActiviteitenLinks: { to: string; label: string; disabled?: boolean }[] = [
  { to: '/activities',        label: 'jouwActiviteiten.selfAdd' },
  { to: '',                   label: 'jouwActiviteiten.quickSuggest', disabled: true },
  { to: '/suggest-from-list', label: 'jouwActiviteiten.fromList' },
]
</script>
