<template>
  <main class="flex flex-col items-center px-4 py-8 gap-6">
    <h1>{{ $t('stress.heading') }}</h1>

    <div v-if="!loaded && !error" class="text-muted text-sm flex flex-col items-center gap-2">
      <span class="spinner" />
      {{ $t('suggest.loading') }}
    </div>

    <div v-else-if="error" class="text-error text-sm flex flex-col items-center gap-2">
      <p>{{ $t('suggest.error') }}</p>
      <LinkButton @click="fetchActivities()">{{ $t('suggest.retry') }}</LinkButton>
    </div>

    <template v-else>
      <!-- Stress selector -->
      <div v-if="!stressLevel" class="flex items-center gap-3">
        <span class="text-xs text-muted">{{ $t('stress.low') }}</span>
        <div class="flex gap-2">
          <button
            v-for="level in 5"
            :key="level"
            class="w-12 h-12 rounded-full border-2 border-outline bg-surface text-lg cursor-pointer transition-colors hover:border-primary hover:bg-primary-light"
            @click="stressLevel = level"
          >
            {{ level }}
          </button>
        </div>
        <span class="text-xs text-muted">{{ $t('stress.high') }}</span>
      </div>

      <!-- No matching activities -->
      <div v-else-if="pool.length === 0" class="text-muted text-sm flex flex-col items-center gap-2">
        {{ $t('stress.noMatch') }}
        <LinkButton @click="stressLevel = null">{{ $t('activity.skip') }}</LinkButton>
      </div>

      <!-- Suggestion flow -->
      <template v-else>
        <ActivityCard
          v-if="current"
          :activity="current"
          @accept="handleAccept"
          @skip="handleSkip"
        />

        <p v-if="accepted" class="text-accepted text-lg font-medium">
          {{ $t('suggest.accepted') }}
        </p>

        <p v-if="!current && !accepted" class="text-muted text-sm">
          {{ $t('suggest.exhausted') }}
        </p>
      </template>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useActivities } from '../composables/useActivities.js'
import {
  useSuggestionFlow,
  stressLevelState,
} from '../composables/useSuggestionFlow.js'
import ActivityCard from '../components/ActivityCard.vue'
import LinkButton from '../components/LinkButton.vue'

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

onMounted(async () => {
  if (!loaded.value) {
    await fetchActivities()
  }
})
</script>
