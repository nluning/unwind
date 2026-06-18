<template>
  <PageShell>
      <PageHeader back @back="handleBack" />

      <StateLoading v-if="!loaded && !error" />

      <StateError v-else-if="error" @retry="fetchActivities()" />

      <template v-else-if="!stressLevel">
        <h1 class="uw-title pt-[80px] max-w-[260px]">{{ $t('stress.prompt') }}</h1>

        <div class="mt-10 px-[22px]">
          <StressLevelPicker v-model="stressLevel" />
        </div>
      </template>

      <StateMessage v-else-if="pool.length === 0">
        {{ $t('stress.noMatch') }}
        <template #action>
          <TextButton @click="stressLevel = null">
            {{ $t('activity.skip') }}
          </TextButton>
        </template>
      </StateMessage>

      <template v-else-if="current">
        <p class="uw-prompt">{{ $t('suggest.heading') }}</p>
        <ActivityCard
          :activity="current"
          @accept="handleAccept"
          @skip="handleSkip"
        />
      </template>

      <SuggestionAccepted v-else-if="accepted" @back="next" />

      <StateMessage v-else>
        {{ $t('suggest.exhausted') }}
      </StateMessage>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useActivities } from '../composables/useActivities.js'
import {
  useSuggestionFlow,
  stressLevelState,
} from '../composables/useSuggestionFlow.js'
import ActivityCard from '../components/ActivityCard.vue'
import StressLevelPicker from '../components/StressLevelPicker.vue'
import TextButton from '../components/TextButton.vue'
import StateLoading from '../components/StateLoading.vue'
import StateError from '../components/StateError.vue'
import StateMessage from '../components/StateMessage.vue'
import SuggestionAccepted from '../components/SuggestionAccepted.vue'
import PageShell from '../components/PageShell.vue'
import PageHeader from '../components/PageHeader.vue'

const router = useRouter()
const { loaded, error, fetchActivities, filterByStress } = useActivities()

const stressLevel = stressLevelState

const pool = computed(() =>
  stressLevel.value ? filterByStress(stressLevel.value) : []
)

const { current, accepted, next, handleAccept, handleSkip } = useSuggestionFlow({
  mode: 'mode2',
  pool,
  extraEventData: () => ({ stress_level_before: stressLevel.value }),
})

function handleBack() {
  if (stressLevel.value !== null) {
    stressLevel.value = null
  } else {
    router.back()
  }
}

onMounted(async () => {
  if (!loaded.value) {
    await fetchActivities()
  }
})
</script>
