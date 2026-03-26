<template>
  <main class="suggest-page">
    <h1>{{ $t('suggest.heading') }}</h1>

    <p v-if="!loaded" class="status">{{ $t('suggest.loading') }}</p>

    <p v-else-if="isEmpty" class="status">{{ $t('activity.empty') }}</p>

    <template v-else>
      <ActivityCard
        v-if="current"
        :activity="current"
        @accept="handleAccept"
        @skip="handleSkip"
      />

      <p v-if="accepted" class="status accepted-message">
        {{ $t('suggest.accepted') }}
      </p>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useActivities } from '../composables/useActivities.js'
import { useSuggestionFlow } from '../composables/useSuggestionFlow.js'
import ActivityCard from '../components/ActivityCard.vue'

const { activities, loaded, isEmpty, fetchActivities } = useActivities()

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

<style scoped>
.suggest-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  gap: 1.5rem;
}

.status {
  color: #888;
  font-size: 0.95rem;
}

.accepted-message {
  color: #2c6e49;
  font-size: 1.1rem;
  font-weight: 500;
}
</style>
