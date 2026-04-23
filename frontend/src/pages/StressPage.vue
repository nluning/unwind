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

      <template v-else-if="!stressLevel">
        <h1 class="uw-title pt-[80px] max-w-[260px]">{{ $t('stress.prompt') }}</h1>

        <div class="mt-10 px-[22px]">
          <div class="flex justify-between items-center">
            <button
              v-for="level in 5"
              :key="level"
              class="w-12 h-12 rounded-full border border-uw-border bg-transparent text-uw-ink font-serif text-lg cursor-pointer transition-colors"
              :class="{
                'bg-uw-primary text-uw-primary-fg border-transparent':
                  stressLevel === level,
              }"
              @click="stressLevel = level"
            >
              {{ level }}
            </button>
          </div>
          <div class="flex justify-between mt-3 text-xs text-uw-ink-mute">
            <span>{{ $t('stress.low') }}</span>
            <span>{{ $t('stress.high') }}</span>
          </div>
        </div>
      </template>

      <div
        v-else-if="pool.length === 0"
        class="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <p class="text-sm text-uw-ink-mute">{{ $t('stress.noMatch') }}</p>
        <LinkButton @click="stressLevel = null">
          {{ $t('activity.skip') }}
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
import { useActivities } from '../composables/useActivities.js'
import {
  useSuggestionFlow,
  stressLevelState,
} from '../composables/useSuggestionFlow.js'
import ActivityCard from '../components/ActivityCard.vue'
import LinkButton from '../components/LinkButton.vue'

const router = useRouter()
const { loaded, error, fetchActivities, filterByStress } = useActivities()

const stressLevel = stressLevelState

const pool = computed(() =>
  stressLevel.value ? filterByStress(stressLevel.value) : []
)

const { current, accepted, handleAccept, handleSkip } = useSuggestionFlow({
  mode: 'mode2',
  pool,
  extraEventData: () => ({ stress_level_before: stressLevel.value }),
})

function handleBack() {
  if (stressLevel.value !== null) {
    stressLevel.value = null
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
