<template>
  <div class="uw-screen">
    <div class="uw-screen__wash" aria-hidden="true" />
    <div class="uw-screen__glow" aria-hidden="true" />

    <div class="uw-frame">
      <header class="uw-header">
        <button
          class="uw-menu-btn"
          :aria-label="$t('nav.back')"
          @click="handleBack"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M10 3 L5 8 L10 13" />
          </svg>
        </button>
        <span class="uw-wordmark">unwind</span>
        <div class="w-[34px]" aria-hidden="true" />
      </header>

      <div
        v-if="!loaded && !error"
        class="flex-1 flex flex-col items-center justify-center gap-2"
      >
        <span class="spinner" />
        <p class="text-sm text-uw-ink-mute">{{ $t('suggest.loading') }}</p>
      </div>

      <div
        v-else-if="error"
        class="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <p class="text-sm text-uw-ink-mute">{{ $t('suggest.error') }}</p>
        <LinkButton @click="fetchActivities()">
          {{ $t('suggest.retry') }}
        </LinkButton>
      </div>

      <template v-else-if="excluded.length === 0">
        <h1 class="uw-title pt-[80px] max-w-[270px]">
          {{ $t('counterbalance.prompt') }}
        </h1>

        <ul class="mt-10 px-[22px] flex flex-col gap-1 list-none" role="list">
          <li v-for="category in categories" :key="category">
            <button
              class="group w-full flex items-center gap-3.5 py-3 px-1.5 text-left bg-transparent border-0 cursor-pointer text-base font-medium text-uw-ink transition-opacity hover:opacity-80"
              @click="excluded = [category]"
            >
              <span
                class="w-10 h-10 rounded-full border border-uw-border inline-flex items-center justify-center flex-shrink-0 text-uw-ink transition-colors group-hover:bg-uw-primary group-hover:text-uw-primary-fg group-hover:border-transparent"
              >
                <svg
                  v-if="category === 'Head'"
width="18" height="18" viewBox="0 0 20 20" fill="none"
       stroke="currentColor" stroke-width="1.5"
       stroke-linecap="round" stroke-linejoin="round">
    <circle cx="10" cy="8" r="5"/>
    <path d="M10 13 v 4 M 7 17 h 6"/>
                </svg>
                <svg
                  v-else-if="category === 'Hands'"
                  width="18"
                  height="18"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 11 V 5 a 1.2 1.2 0 0 1 2.4 0 V 9 M 8.4 9 V 3.5 a 1.2 1.2 0 0 1 2.4 0 V 9 M 10.8 9 V 4 a 1.2 1.2 0 0 1 2.4 0 V 10 M 13.2 10 V 6 a 1.2 1.2 0 0 1 2.4 0 V 12 a 5 5 0 0 1 -9.6 1 L 4.5 10 a 1 1 0 0 1 1.5 -1" />
                </svg>
                <svg
                  v-else
                  width="18"
                  height="18"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M10 16 L 3.5 9.5 a 3.8 3.8 0 0 1 5.4 -5.4 L 10 5.2 l 1.1 -1.1 a 3.8 3.8 0 0 1 5.4 5.4 Z" />
                </svg>
              </span>
              <span>{{ $t(`categories.${category}`) }}</span>
            </button>
          </li>
        </ul>
      </template>

      <div
        v-else-if="pool.length === 0"
        class="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <p class="text-sm text-uw-ink-mute">{{ $t('activity.empty') }}</p>
        <LinkButton @click="excluded = []">
          {{ $t('counterbalance.prompt') }}
        </LinkButton>
      </div>

      <template v-else-if="current">
        <p class="uw-prompt">{{ $t('suggest.heading') }}</p>
        <ActivityCard
          :activity="current"
          @accept="handleAccept"
          @skip="handleSkip"
        />
      </template>

      <div
        v-else-if="accepted"
        class="flex-1 flex items-center justify-center px-6"
      >
        <p class="text-2xl font-serif text-uw-primary">
          {{ $t('suggest.accepted') }}
        </p>
      </div>

      <div
        v-else
        class="flex-1 flex items-center justify-center px-6"
      >
        <p class="text-sm text-uw-ink-mute">{{ $t('suggest.exhausted') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useActivities, CATEGORY_ID_MAP } from '../composables/useActivities.js'
import {
  useSuggestionFlow,
  excludedCategoriesState,
} from '../composables/useSuggestionFlow.js'
import ActivityCard from '../components/ActivityCard.vue'
import LinkButton from '../components/LinkButton.vue'

const router = useRouter()
const categories = Object.keys(CATEGORY_ID_MAP)

const { loaded, error, fetchActivities, filterByExcludedCategories } =
  useActivities()

const excluded = excludedCategoriesState

const pool = computed(() =>
  excluded.value.length > 0 ? filterByExcludedCategories(excluded.value) : []
)

const { current, accepted, handleAccept, handleSkip } = useSuggestionFlow({
  mode: 'mode3',
  pool,
})

function handleBack() {
  if (excluded.value.length > 0) {
    excluded.value = []
  } else {
    router.back()
  }
}

onMounted(async () => {
  if (!loaded.value) {
    await fetchActivities()
  }
})
</script>
