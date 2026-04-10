<template>
  <main class="stress-page">
    <h1>{{ $t('stress.heading') }}</h1>

    <div v-if="!loaded && !error" class="status">
      <span class="spinner" />
      {{ $t('suggest.loading') }}
    </div>

    <div v-else-if="error" class="status error-message">
      <p>{{ $t('suggest.error') }}</p>
      <button class="link-button" @click="fetchActivities()">{{ $t('suggest.retry') }}</button>
    </div>

    <template v-else>
      <!-- Stress selector -->
      <div v-if="!stressLevel" class="stress-selector">
        <span class="stress-label">{{ $t('stress.low') }}</span>
        <div class="stress-buttons">
          <button
            v-for="level in 5"
            :key="level"
            class="stress-btn"
            @click="stressLevel = level"
          >
            {{ level }}
          </button>
        </div>
        <span class="stress-label">{{ $t('stress.high') }}</span>
      </div>

      <!-- No matching activities -->
      <p v-else-if="pool.length === 0" class="status">
        {{ $t('stress.noMatch') }}
        <button class="link-button" @click="stressLevel = null">
          {{ $t('activity.skip') }}
        </button>
      </p>

      <!-- Suggestion flow -->
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
    </template>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useActivities } from '../composables/useActivities.js'
import { useSuggestionFlow } from '../composables/useSuggestionFlow.js'
import ActivityCard from '../components/ActivityCard.vue'

const { loaded, error, fetchActivities, filterByStress } = useActivities()

const stressLevel = ref<number | null>(null)

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

<style scoped>
.stress-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  gap: 1.5rem;
}

.stress-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stress-label {
  font-size: 0.8rem;
  color: #888;
}

.stress-buttons {
  display: flex;
  gap: 0.5rem;
}

.stress-btn {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  border: 2px solid #ccc;
  background: white;
  font-size: 1.125rem;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.stress-btn:hover {
  border-color: #2c6e49;
  background: #e8f5e9;
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
