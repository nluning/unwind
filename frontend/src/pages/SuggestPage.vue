<template>
  <PageShell>
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

      <StateMessage v-else-if="accepted" variant="accent">
        {{ $t('suggest.accepted') }}
      </StateMessage>

      <StateMessage v-else>
        {{ $t('suggest.exhausted') }}
      </StateMessage>
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
import PageShell from '../components/PageShell.vue'
import PageHeader from '../components/PageHeader.vue'

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
