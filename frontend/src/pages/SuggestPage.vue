<template>
  <main class="flex flex-col items-center px-4 py-8 gap-6">
    <h1>{{ $t('suggest.heading') }}</h1>

    <div v-if="!loaded && !error" class="text-muted text-sm flex flex-col items-center gap-2">
      <span class="spinner" />
      {{ $t('suggest.loading') }}
    </div>

    <div v-else-if="error" class="text-error text-sm flex flex-col items-center gap-2">
      <p>{{ $t('suggest.error') }}</p>
      <LinkButton @click="fetchActivities()">{{ $t('suggest.retry') }}</LinkButton>
    </div>

    <p v-else-if="isEmpty" class="text-muted text-sm">{{ $t('activity.empty') }}</p>

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
  </main>
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
