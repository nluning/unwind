<template>
  <PageShell>
      <WelcomeCard v-if="showWelcome" @dismiss="dismiss" />

      <template v-else>
        <PageHeader />

        <p class="uw-prompt">{{ $t('suggest.heading') }}</p>

        <StateLoading v-if="!loaded && !error" />

        <StateError v-else-if="error" @retry="fetchActivities()" />

        <StateMessage v-else-if="isEmpty">
          {{ $t('activity.empty') }}
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
import { useSuggestionFlow } from '../composables/useSuggestionFlow.js'
import ActivityCard from '../components/ActivityCard.vue'
import StateLoading from '../components/StateLoading.vue'
import StateError from '../components/StateError.vue'
import StateMessage from '../components/StateMessage.vue'
import SuggestionAccepted from '../components/SuggestionAccepted.vue'
import PageShell from '../components/PageShell.vue'
import PageHeader from '../components/PageHeader.vue'
import WelcomeCard from '../components/WelcomeCard.vue'
import { useWelcome } from '../composables/useWelcome.js'

const { activities, loaded, error, isEmpty, fetchActivities } = useActivities()

const pool = computed(() => activities.value)

const { current, accepted, next, handleAccept, handleSkip } = useSuggestionFlow({
  mode: 'mode1',
  pool,
})

// Decoupled from auth state on purpose: unwind-device-id is already set by
// the time SuggestPage mounts, so it can't distinguish "first ever open"
// from "second open". A dedicated key flips independently for QA and
// survives logout/upgrade. Shared with App.vue so the chrome (BottomNav,
// UserMenu) hides during the landing.
const { isWelcomed, dismiss } = useWelcome()
const showWelcome = computed(() => !isWelcomed.value)

onMounted(async () => {
  if (!loaded.value) {
    await fetchActivities()
  }
})
</script>
