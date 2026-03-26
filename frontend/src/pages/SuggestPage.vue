<template>
  <main class="suggest-page">
    <h1>{{ $t('suggest.heading') }}</h1>

    <p v-if="!loaded" class="status">{{ $t('suggest.loading') }}</p>

    <p v-else-if="isEmpty" class="status">{{ $t('activity.empty') }}</p>

    <template v-else>
      <!-- No activity shown yet — show the start button -->
      <button v-if="!current" class="btn-suggest" @click="next">
        {{ $t('suggest.start') }}
      </button>

      <!-- Activity card -->
      <ActivityCard
        v-else-if="current"
        :activity="current"
        @accept="handleAccept"
        @skip="handleSkip"
      />

      <!-- After accepting -->
      <p v-if="accepted" class="status accepted-message">
        {{ $t('suggest.accepted') }}
      </p>
    </template>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useActivities, type Activity } from '../composables/useActivities.js'
import { api } from '../api/client.js'
import ActivityCard from '../components/ActivityCard.vue'

const { loaded, isEmpty, fetchActivities, suggest, markAccepted } = useActivities()

const current = ref<Activity | null>(null)
const accepted = ref(false)

onMounted(async () => {
  if (!loaded.value) {
    await fetchActivities()
  }
})

function next() {
  accepted.value = false
  current.value = suggest()
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
      mode: 'mode1',
    }),
  })
}
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

.btn-suggest {
  padding: 1rem 2rem;
  background: #2c6e49;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1.125rem;
  cursor: pointer;
}
</style>
