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

        <div
          v-else-if="current"
          class="flex-1 flex flex-col"
        >
          <ActivityCard
            :key="current.id"
            :activity="current"
            @accept="handleAccept"
            @skip="handleSkip"
            @open-sheet="openSheet"
          />

          <!-- Inconspicuous handle: swipe up anywhere on the card, or tap this,
               to open the action menu. Faint by design; clickable on desktop. -->
          <button
            type="button"
            class="self-center mt-2 mb-1 p-2 bg-transparent border-0 cursor-pointer opacity-25 hover:opacity-50 transition-opacity"
            :aria-label="$t('suggest.actions.open')"
            @click="openSheet"
          >
            <span class="block h-1 w-8 rounded-full bg-uw-ink" aria-hidden="true" />
          </button>
        </div>

        <SuggestionAccepted v-else-if="accepted" @back="next" />

        <StateMessage v-else>
          {{ $t('suggest.exhausted') }}
        </StateMessage>
      </template>

      <ActivityActionSheet
        v-if="sheetActivity"
        :activity="sheetActivity"
        @close="closeSheet"
        @delete="handleRemove"
        @chat="handleChat"
      />
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Activity } from '../types/activity.js'
import { useActivities } from '../composables/useActivities.js'
import {
  useSuggestionFlow,
  suggestFilterStressState,
  suggestFilterCategoriesState,
} from '../composables/useSuggestionFlow.js'
import { setChatSeed } from '../composables/useChat.js'
import ActivityCard from '../components/ActivityCard.vue'
import ActivityActionSheet from '../components/ActivityActionSheet.vue'
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
  deleteActivity,
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

// Swipe-up / handle → action sheet. The activity is snapshotted on open so the
// sheet keeps operating on it even as `current` advances after a delete.
const router = useRouter()
const sheetActivity = ref<Activity | null>(null)

function openSheet() {
  if (current.value) sheetActivity.value = current.value
}

function closeSheet() {
  sheetActivity.value = null
}

async function handleRemove() {
  const activity = sheetActivity.value
  if (!activity) return
  closeSheet()
  // Persisted delete: deleteActivity hits DELETE /activities/:id, which the
  // backend hard-deletes (the user's own) or permanently hides (base library,
  // via user_hidden_activities). It then drops it from the local `activities`
  // cache, so the pool recomputes and the useSuggestionFlow watcher advances
  // `current` to a fresh suggestion.
  try {
    await deleteActivity(activity.id)
  } catch {
    // Roll back to server truth so a failed delete doesn't silently vanish.
    await fetchActivities()
  }
}

function handleChat() {
  const activity = sheetActivity.value
  if (!activity) return
  setChatSeed(activity)
  router.push('/chat')
}

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
