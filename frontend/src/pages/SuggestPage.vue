<template>
  <main class="suggest-page">
    <h1>{{ $t('suggest.heading') }}</h1>

    <div v-if="!loaded && !error" class="status">
      <span class="spinner" />
      {{ $t('suggest.loading') }}
    </div>

    <div v-else-if="error" class="status error-message">
      <p>{{ $t('suggest.error') }}</p>
      <button class="link-button" @click="fetchActivities()">{{ $t('suggest.retry') }}</button>
    </div>

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

      <p v-if="!current && !accepted" class="status">
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.accepted-message {
  color: #2c6e49;
  font-size: 1.1rem;
  font-weight: 500;
}

.error-message {
  color: #c0392b;
}

.link-button {
  background: none;
  border: none;
  color: #2c6e49;
  cursor: pointer;
  text-decoration: underline;
  font-size: inherit;
  padding: 0;
}

.spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #e0e0e0;
  border-top-color: #2c6e49;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
