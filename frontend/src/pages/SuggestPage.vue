<template>
  <div class="uw-screen">
    <div class="uw-screen__wash" aria-hidden="true" />
    <div class="uw-screen__glow" aria-hidden="true" />

    <div class="uw-frame">
      <header class="uw-header">
        <span class="uw-wordmark">unwind</span>
      </header>

      <p class="uw-prompt">{{ $t('suggest.heading') }}</p>

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
        <LinkButton @click="fetchActivities()">
          {{ $t('suggest.retry') }}
        </LinkButton>
      </div>

      <div
        v-else-if="isEmpty"
        class="flex-1 flex items-center justify-center px-6"
      >
        <p class="text-sm" :style="{ color: 'var(--uw-ink-mute)' }">
          {{ $t('activity.empty') }}
        </p>
      </div>

      <ActivityCard
        v-else-if="current"
        :activity="current"
        @accept="handleAccept"
        @skip="handleSkip"
      />

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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useActivities } from '../composables/useActivities.js'
import { useSuggestionFlow } from '../composables/useSuggestionFlow.js'
import ActivityCard from '../components/ActivityCard.vue'
import LinkButton from '../components/LinkButton.vue'

const { activities, loaded, error, isEmpty, fetchActivities } = useActivities()

const pool = computed(() => activities.value)

const { current, accepted, handleAccept, handleSkip } = useSuggestionFlow({
  mode: 'mode1',
  pool,
})

onMounted(async () => {
  if (!loaded.value) {
    await fetchActivities()
  }
})
</script>
