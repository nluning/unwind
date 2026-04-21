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

    <!-- Pick state -->
    <template v-if="!stressLevel">
      <h1 class="uw-title uw-title--tight">{{ $t('stress.prompt') }}</h1>
      <div class="uw-stress-scale">
        <div class="uw-stress-scale__row">
          <button
            v-for="n in 5"
            :key="n"
            class="uw-stress-dot"
            :class="{ 'is-selected': stressLevel === n }"
            @click="stressLevel = n"
          >{{ n }}</button>
        </div>
        <div class="uw-stress-scale__labels">
          <span>{{ $t('stress.low') }}</span>
          <span>{{ $t('stress.high') }}</span>
        </div>
      </div>
    </template>

    <!-- Suggestion state -->
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
import { useActivities } from '../composables/useActivities.js'
import { useSuggestionFlow } from '../composables/useSuggestionFlow.js'
import { useTheme } from '../composables/useTheme.js'

defineEmits(['open-menu', 'accept', 'skip'])

const { colorScheme: theme } = useTheme()
const { loaded, fetchActivities, filterByStress } = useActivities()
const stressLevel = ref<number | null>(null)
const pool = computed(() => stressLevel.value ? filterByStress(stressLevel.value) : [])
const { current, handleAccept, handleSkip } = useSuggestionFlow({
  mode: 'mode2',
  pool,
  extraEventData: () => ({ stress_level_before: stressLevel.value }),
})

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
.uw-title--tight { padding-top: 52px; max-width: 260px; font-size: 30px; }

.uw-stress-scale        { position: absolute; left: 0; right: 0; bottom: 120px; padding: 0 22px; }
.uw-stress-scale__row   { display: flex; justify-content: space-between; align-items: center; }
.uw-stress-scale__labels{
  display: flex; justify-content: space-between; margin-top: 12px;
  font-size: 12px; color: var(--uw-ink-mute);
}

.uw-stress-dot {
  width: 48px; height: 48px; border-radius: 24px;
  border: 1px solid var(--uw-border);
  background: transparent; color: var(--uw-ink);
  font-family: var(--uw-font-serif); font-size: 17px; font-weight: 400;
  cursor: pointer;
  transition: background 160ms ease, color 160ms ease;
}
.uw-stress-dot.is-selected {
  background: var(--uw-primary);
  color: var(--uw-primary-fg);
  border-color: transparent;
}

.uw-nav__item { text-decoration: none; }
</style>
