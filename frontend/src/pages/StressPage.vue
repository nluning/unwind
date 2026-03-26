<template>
  <main class="stress-page">
    <h1>{{ $t('stress.heading') }}</h1>

    <p v-if="!loaded" class="status">{{ $t('suggest.loading') }}</p>

    <template v-else>
      <!-- Stress selector -->
      <div v-if="!stressLevel" class="stress-selector">
        <span class="stress-label">{{ $t('stress.low') }}</span>
        <div class="stress-buttons">
          <button
            v-for="level in 5"
            :key="level"
            class="stress-btn"
            @click="selectStress(level)"
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

      <!-- Suggestion flow (same pattern as Mode 1) -->
      <template v-else>
        <button v-if="!current" class="btn-suggest" @click="next">
          {{ $t('suggest.start') }}
        </button>

        <ActivityCard
          v-else-if="current"
          :activity="current"
          @accept="handleAccept"
          @skip="handleSkip"
        />

        <p v-if="accepted" class="status accepted-message">
          {{ $t('suggest.accepted') }}
        </p>
      </template>
    </template>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useActivities, type Activity } from '../composables/useActivities.js'
import { api } from '../api/client.js'
import ActivityCard from '../components/ActivityCard.vue'

const { loaded, fetchActivities, filterByStress, suggest, markAccepted } = useActivities()

const stressLevel = ref<number | null>(null)
const current = ref<Activity | null>(null)
const accepted = ref(false)

const pool = computed(() =>
  stressLevel.value ? filterByStress(stressLevel.value) : []
)

onMounted(async () => {
  if (!loaded.value) {
    await fetchActivities()
  }
})

function selectStress(n: number) {
  stressLevel.value = n
  accepted.value = false
  current.value = null
}

function next() {
  accepted.value = false
  current.value = suggest(pool.value)
}

async function handleAccept() {
  if (!current.value) return

  markAccepted(current.value.id)
  logEvent(current.value.id, 'accepted')
  current.value = null
  accepted.value = true
}

async function handleSkip() {
  if (!current.value) return

  logEvent(current.value.id, 'skipped')
  next()
}

function logEvent(activityId: string, action: 'accepted' | 'skipped') {
  api('/usage-events', {
    method: 'POST',
    body: JSON.stringify({
      activity_id: activityId,
      action,
      mode: 'mode2',
      stress_level_before: stressLevel.value,
    }),
  })
}
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
}

.accepted-message {
  color: #2c6e49;
  font-size: 1.1rem;
  font-weight: 500;
}

.btn-suggest {
  padding: 1rem 2rem;
  background: #2c6e49;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1.125rem;
  cursor: pointer;
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
</style>
