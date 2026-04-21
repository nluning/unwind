<template>
  <div class="uw-screen">
    <div class="uw-screen__wash" aria-hidden="true" />
    <div class="uw-screen__glow" aria-hidden="true" />

    <div class="uw-frame">
      <header class="uw-header">
      <span class="uw-wordmark">unwind</span>
      <UserMenu variant="horizon" />
    </header>

    <div
      v-if="!loaded && !error"
      class="flex-1 flex flex-col items-center justify-center gap-2"
    >
      <span class="spinner" />
      <p class="text-sm" :style="{ color: 'var(--uw-ink-mute)' }">
        {{ $t('suggest.loading') }}
      </p>
    </div>

    <div
      v-else-if="error"
      class="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <p class="text-sm" :style="{ color: 'var(--uw-ink-mute)' }">
        {{ $t('suggest.error') }}
      </p>
      <button class="uw-actions__secondary" @click="fetchActivities()">
        {{ $t('suggest.retry') }}
      </button>
    </div>

    <div
      v-else-if="isEmpty"
      class="flex-1 flex items-center justify-center px-6"
    >
      <p class="text-sm" :style="{ color: 'var(--uw-ink-mute)' }">
        {{ $t('activity.empty') }}
      </p>
    </div>

    <template v-else-if="current">
      <p class="uw-prompt">{{ $t('suggest.heading') }}</p>

      <h1 class="uw-title">
        {{ $t(`activities.${slug}.title`, current.title) }}
      </h1>

      <p v-if="current.description" class="uw-body">
        {{ $t(`activities.${slug}.description`, current.description) }}
      </p>

      <div class="uw-chips">
        <span class="uw-chip">
          {{ $t('activity.duration', { minutes: current.suggested_duration }) }}
        </span>
        <span
          v-for="category in current.categories"
          :key="category"
          class="uw-chip"
        >
          {{ $t(`categories.${category}`, category) }}
        </span>
      </div>

      <div class="uw-actions mt-auto mb-14">
        <button class="uw-actions__primary" @click="handleAccept">
          <span class="uw-badge" aria-hidden="true">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="3 8 6.5 11.5 13 5" />
            </svg>
          </span>
          {{ $t('activity.accept') }}
        </button>

        <button class="uw-actions__secondary" @click="handleSkip">
          {{ $t('activity.skip') }}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M3 8 h 10 M 9 4 l 4 4 -4 4" />
          </svg>
        </button>
      </div>
    </template>

    <div
      v-else-if="accepted"
      class="flex-1 flex items-center justify-center px-6"
    >
      <p
        class="text-2xl"
        :style="{ fontFamily: 'var(--uw-font-serif)', color: 'var(--uw-primary)' }"
      >
        {{ $t('suggest.accepted') }}
      </p>
    </div>

    <div
      v-else
      class="flex-1 flex items-center justify-center px-6"
    >
      <p class="text-sm" :style="{ color: 'var(--uw-ink-mute)' }">
        {{ $t('suggest.exhausted') }}
      </p>
    </div>

    <nav class="uw-nav" :aria-label="$t('nav.label')">
      <router-link
        to="/suggest"
        v-slot="{ isExactActive, href, navigate }"
        custom
      >
        <a
          :href="href"
          class="uw-nav__item"
          :class="{ 'uw-nav__item--active': isExactActive }"
          @click="navigate"
        >
          {{ $t('nav.suggest') }}
        </a>
      </router-link>
      <router-link
        to="/chat"
        v-slot="{ isExactActive, href, navigate }"
        custom
      >
        <a
          :href="href"
          class="uw-nav__item"
          :class="{ 'uw-nav__item--active': isExactActive }"
          @click="navigate"
        >
          {{ $t('nav.chat') }}
        </a>
      </router-link>
    </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useActivities } from '../composables/useActivities.js'
import { useSuggestionFlow } from '../composables/useSuggestionFlow.js'
import UserMenu from '../components/UserMenu.vue'

const { activities, loaded, error, isEmpty, fetchActivities } = useActivities()

const pool = computed(() => activities.value)

const { current, accepted, handleAccept, handleSkip } = useSuggestionFlow({
  mode: 'mode1',
  pool,
})

const slug = computed(() => {
  if (!current.value) return ''
  return current.value.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
})

onMounted(async () => {
  if (!loaded.value) {
    await fetchActivities()
  }
})
</script>
