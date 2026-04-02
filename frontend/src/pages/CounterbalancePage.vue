<template>
  <main class="counterbalance-page">
    <h1>{{ $t('counterbalance.heading') }}</h1>

    <p v-if="!loaded" class="status">{{ $t('suggest.loading') }}</p>

    <template v-else>
      <!-- Category picker -->
      <div v-if="excluded.length === 0" class="category-picker">
        <p class="prompt">{{ $t('counterbalance.prompt') }}</p>
        <div class="category-buttons">
          <button
            v-for="category in categories"
            :key="category"
            class="category-btn"
            @click="excluded = [category]"
          >
            {{ $t(`categories.${category}`) }}
          </button>
        </div>
      </div>

      <!-- No matching activities -->
      <p v-else-if="pool.length === 0" class="status">
        {{ $t('activity.empty') }}
        <button class="link-button" @click="excluded = []">
          ← {{ $t('counterbalance.prompt') }}
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

        <button class="link-button" @click="excluded = []">
          ← {{ $t('counterbalance.prompt') }}
        </button>
      </template>
    </template>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useActivities, CATEGORY_ID_MAP } from '../composables/useActivities.js'
import { useSuggestionFlow } from '../composables/useSuggestionFlow.js'
import ActivityCard from '../components/ActivityCard.vue'

const categories = Object.keys(CATEGORY_ID_MAP)

const { loaded, fetchActivities, filterByExcludedCategories } = useActivities()

const excluded = ref<string[]>([])

const pool = computed(() =>
  excluded.value.length > 0 ? filterByExcludedCategories(excluded.value) : []
)

const { current, accepted, handleAccept, handleSkip } = useSuggestionFlow({
  mode: 'mode3',
  pool,
})

onMounted(async () => {
  if (!loaded.value) {
    await fetchActivities()
  }
})
</script>

<style scoped>
.counterbalance-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  gap: 1.5rem;
}

.prompt {
  color: #555;
  font-size: 0.95rem;
  text-align: center;
}

.category-picker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.category-buttons {
  display: flex;
  gap: 0.75rem;
}

.category-btn {
  padding: 0.875rem 1.5rem;
  border-radius: 0.75rem;
  border: 2px solid #ccc;
  background: white;
  font-size: 1rem;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.category-btn:hover {
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

.link-button {
  background: none;
  border: none;
  color: #2c6e49;
  cursor: pointer;
  text-decoration: underline;
  font-size: 0.875rem;
  padding: 0;
}
</style>
