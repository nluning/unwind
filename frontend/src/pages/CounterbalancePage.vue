<template>
  <main class="flex flex-col items-center px-4 py-8 gap-6">
    <h1>{{ $t('counterbalance.heading') }}</h1>

    <div v-if="!loaded && !error" class="text-muted text-sm flex flex-col items-center gap-2">
      <span class="spinner" />
      {{ $t('suggest.loading') }}
    </div>

    <div v-else-if="error" class="text-error text-sm flex flex-col items-center gap-2">
      <p>{{ $t('suggest.error') }}</p>
      <LinkButton @click="fetchActivities()">{{ $t('suggest.retry') }}</LinkButton>
    </div>

    <template v-else>
      <!-- Category picker -->
      <div v-if="excluded.length === 0" class="flex flex-col items-center gap-4">
        <p class="text-dim text-sm text-center">{{ $t('counterbalance.prompt') }}</p>
        <div class="flex gap-3">
          <button
            v-for="category in categories"
            :key="category"
            class="py-3.5 px-6 rounded-xl border-2 border-outline bg-surface text-base cursor-pointer transition-colors hover:border-primary hover:bg-primary-light"
            @click="excluded = [category]"
          >
            {{ $t(`categories.${category}`) }}
          </button>
        </div>
      </div>

      <!-- No matching activities -->
      <div v-else-if="pool.length === 0" class="text-muted text-sm flex flex-col items-center gap-2">
        {{ $t('activity.empty') }}
        <LinkButton class="text-sm" @click="excluded = []">
          ← {{ $t('counterbalance.prompt') }}
        </LinkButton>
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

        <LinkButton class="text-sm" @click="excluded = []">
          ← {{ $t('counterbalance.prompt') }}
        </LinkButton>
      </template>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useActivities, CATEGORY_ID_MAP } from '../composables/useActivities.js'
import {
  useSuggestionFlow,
  excludedCategoriesState,
} from '../composables/useSuggestionFlow.js'
import ActivityCard from '../components/ActivityCard.vue'
import LinkButton from '../components/LinkButton.vue'

const categories = Object.keys(CATEGORY_ID_MAP)

const { loaded, error, fetchActivities, filterByExcludedCategories } = useActivities()

const excluded = excludedCategoriesState

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
