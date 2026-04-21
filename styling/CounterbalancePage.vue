<template>
  <main class="uw-screen" :class="`uw-theme-${theme}`">
    <div v-if="theme === 'playful'" class="uw-screen__wash" aria-hidden="true" />
    <div v-else class="uw-screen__glow" aria-hidden="true" />

    <header class="uw-header">
      <button class="uw-back" :aria-label="$t('nav.back')" @click="$router.back()">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3 L5 8 L10 13"/></svg>
      </button>
      <span class="uw-wordmark">unwind</span>
      <button class="uw-menu-btn" :aria-label="$t('menu.label')" @click="$emit('open-menu')">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="5" x2="13" y2="5"/><line x1="3" y1="8" x2="13" y2="8"/><line x1="3" y1="11" x2="13" y2="11"/></svg>
      </button>
    </header>

    <!-- Category pick -->
    <template v-if="excluded.length === 0">
      <h1 class="uw-title uw-title--tight">{{ $t('counterbalance.prompt') }}</h1>

      <ul class="uw-cat-list" role="list">
        <li v-for="cat in categories" :key="cat">
          <button class="uw-cat" @click="excluded = [cat]">
            <span class="uw-cat__glyph" aria-hidden="true">
              <!-- Head -->
              <svg v-if="cat === 'Head'" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 4 C 7.5 4 6 5.8 6 7.5 C 5 7.8 4.5 8.8 5 9.8 C 4.5 10.5 4.8 11.6 5.6 12 C 5.4 13 6.2 14 7.2 14 L 8 14 L 8 16.5"/>
                <path d="M10 4 C 12.5 4 14 5.8 14 7.5 C 15 7.8 15.5 8.8 15 9.8 C 15.5 10.5 15.2 11.6 14.4 12 C 14.6 13 13.8 14 12.8 14 L 12 14 L 12 16.5"/>
              </svg>
              <!-- Hands -->
              <svg v-else-if="cat === 'Hands'" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 11 V 5 a 1.2 1.2 0 0 1 2.4 0 V 9 M 8.4 9 V 3.5 a 1.2 1.2 0 0 1 2.4 0 V 9 M 10.8 9 V 4 a 1.2 1.2 0 0 1 2.4 0 V 10 M 13.2 10 V 6 a 1.2 1.2 0 0 1 2.4 0 V 12 a 5 5 0 0 1 -9.6 1 L 4.5 10 a 1 1 0 0 1 1.5 -1"/>
              </svg>
              <!-- Heart -->
              <svg v-else width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 16 L 3.5 9.5 a 3.8 3.8 0 0 1 5.4 -5.4 L 10 5.2 l 1.1 -1.1 a 3.8 3.8 0 0 1 5.4 5.4 Z"/>
              </svg>
            </span>
            <span class="uw-cat__label">{{ $t(`categories.${cat}`) }}</span>
          </button>
        </li>
      </ul>
    </template>

    <!-- Suggestion -->
    <template v-else-if="current">
      <h1 class="uw-title">{{ current.title }}</h1>
      <p v-if="current.description" class="uw-body">{{ current.description }}</p>
      <div class="uw-chips">
        <span class="uw-chip">{{ $t('activity.duration', { minutes: current.duration_minutes }) }}</span>
        <span class="uw-chip">{{ $t(`categories.${current.category}`) }}</span>
      </div>
      <div class="uw-actions">
        <button class="uw-actions__primary" @click="$emit('accept', current)">
          <span class="uw-badge">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 8 6.5 11.5 13 5"/></svg>
          </span>
          {{ $t('activity.accept') }}
        </button>
        <button class="uw-actions__secondary" @click="$emit('skip', current)">
          {{ $t('activity.skip') }}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 8 h 10 M 9 4 l 4 4 -4 4"/></svg>
        </button>
      </div>
    </template>

    <nav class="uw-nav" :aria-label="$t('nav.label')">
      <router-link to="/" class="uw-nav__item uw-nav__item--active">{{ $t('nav.suggest') }}</router-link>
      <router-link to="/chat" class="uw-nav__item">{{ $t('nav.chat') }}</router-link>
    </nav>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useActivities, CATEGORY_ID_MAP } from '../composables/useActivities.js'
import { useSuggestionFlow } from '../composables/useSuggestionFlow.js'
import { useTheme } from '../composables/useTheme.js'

defineEmits(['open-menu', 'accept', 'skip'])

const { colorScheme: theme } = useTheme()
const categories = Object.keys(CATEGORY_ID_MAP)
const { loaded, fetchActivities, filterByExcludedCategories } = useActivities()

const excluded = ref<string[]>([])
const pool = computed(() => excluded.value.length ? filterByExcludedCategories(excluded.value) : [])
const { current, handleAccept, handleSkip } = useSuggestionFlow({ mode: 'mode3', pool })

onMounted(async () => { if (!loaded.value) await fetchActivities() })
</script>

<style scoped>
.uw-back {
  width: 34px; height: 34px; border-radius: 17px;
  border: 0; padding: 0;
  background: var(--uw-menu-bg);
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--uw-ink); cursor: pointer;
}
.uw-title--tight { padding-top: 52px; max-width: 270px; font-size: 28px; }

.uw-cat-list {
  position: absolute; left: 22px; right: 22px; bottom: 130px;
  list-style: none; margin: 0; padding: 0;
  display: flex; flex-direction: column; gap: 4px;
}
.uw-cat {
  width: 100%;
  padding: 12px 6px;
  border: 0; background: transparent;
  color: var(--uw-ink);
  font-family: var(--uw-font-sans);
  font-size: 16px; font-weight: 500;
  cursor: pointer;
  display: flex; align-items: center; gap: 14px;
  text-align: left;
  transition: opacity 120ms ease;
}
.uw-cat:hover { opacity: 0.7; }

.uw-cat__glyph {
  width: 40px; height: 40px; border-radius: 20px;
  border: 1px solid var(--uw-border);
  color: var(--uw-ink);
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.uw-cat:hover .uw-cat__glyph,
.uw-cat:focus-visible .uw-cat__glyph {
  background: var(--uw-primary);
  color: var(--uw-primary-fg);
  border-color: transparent;
}

.uw-nav__item { text-decoration: none; }
</style>
