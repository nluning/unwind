<template>
  <PageShell>
      <WelcomeCard v-if="showWelcome" @dismiss="dismiss" />

      <template v-else>
        <PageHeader wordmark />

        <SuggestFilters v-if="loaded && !error && !isEmpty" />

        <p class="uw-prompt">{{ $t('suggest.heading') }}</p>

        <StateLoading v-if="!loaded && !error" />

        <StateError v-else-if="error" @retry="fetchActivities()" />

        <StateMessage v-else-if="isEmpty">
          {{ $t('activity.empty') }}
        </StateMessage>

        <StateMessage v-else-if="pool.length === 0">
          {{ $t('filter.noMatch') }}
          <template #action>
            <TextButton @click="clearFilters">
              {{ $t('filter.clear') }}
            </TextButton>
          </template>
        </StateMessage>

        <ActivityCard
          v-else-if="current"
          :activity="current"
          @accept="handleAccept"
          @skip="handleSkip"
        />

        <SuggestionAccepted v-else-if="accepted" @back="next" />

        <StateMessage v-else>
          {{ $t('suggest.exhausted') }}
        </StateMessage>
      </template>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useActivities } from '../composables/useActivities.js'
import {
  useSuggestionFlow,
  suggestFilterStressState,
  suggestFilterCategoriesState,
} from '../composables/useSuggestionFlow.js'
import ActivityCard from '../components/ActivityCard.vue'
import StateLoading from '../components/StateLoading.vue'
import StateError from '../components/StateError.vue'
import StateMessage from '../components/StateMessage.vue'
import SuggestionAccepted from '../components/SuggestionAccepted.vue'
import SuggestFilters from '../components/SuggestFilters.vue'
import TextButton from '../components/TextButton.vue'
import PageShell from '../components/PageShell.vue'
import PageHeader from '../components/PageHeader.vue'
import WelcomeCard from '../components/WelcomeCard.vue'
import { useWelcome } from '../composables/useWelcome.js'

const {
  activities,
  loaded,
  error,
  isEmpty,
  fetchActivities,
  filterByStress,
  filterByIncludedCategories,
} = useActivities()

const pool = computed(() => {
  let result = activities.value
  if (suggestFilterStressState.value !== null) {
    result = filterByStress(suggestFilterStressState.value, result)
  }
  if (suggestFilterCategoriesState.value.length > 0) {
    result = filterByIncludedCategories(suggestFilterCategoriesState.value, result)
  }
  return result
})

function clearFilters() {
  suggestFilterStressState.value = null
  suggestFilterCategoriesState.value = []
}

const { current, accepted, next, handleAccept, handleSkip } = useSuggestionFlow({
  mode: 'mode1',
  pool,
})

// Decoupled from auth state on purpose: unwind-device-id is already set by
// the time SuggestPage mounts, so it can't distinguish "first ever open"
// from "second open". A dedicated key flips independently for QA and
// survives logout/upgrade. Shared with App.vue so the UserMenu hides during
// the landing.
const { isWelcomed, dismiss } = useWelcome()
const showWelcome = computed(() => !isWelcomed.value)

onMounted(async () => {
  if (!loaded.value) {
    await fetchActivities()
  }
})
</script>
