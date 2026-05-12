<template>
  <PageShell>
      <PageHeader back @back="handleBack" />

      <StateLoading v-if="!loaded && !error" />

      <StateError v-else-if="error" @retry="fetchActivities()" />

      <template v-else-if="excluded.length === 0">
        <h1 class="uw-title pt-[80px] max-w-[270px]">
          {{ $t('counterbalance.prompt') }}
        </h1>

        <ul class="mt-10 px-[22px] flex flex-col gap-1 list-none" role="list">
          <li v-for="category in categories" :key="category">
            <button
              class="group w-full flex items-center gap-3.5 py-3 px-1.5 text-left bg-transparent border-0 cursor-pointer text-base font-medium text-uw-ink transition-opacity hover:opacity-80"
              @click="excluded = [category]"
            >
              <span
                class="w-10 h-10 rounded-full border border-uw-border inline-flex items-center justify-center flex-shrink-0 text-uw-ink transition-colors group-hover:bg-uw-primary group-hover:text-uw-primary-fg group-hover:border-transparent"
              >
                <HeadIcon v-if="category === 'Head'" />
                <HandsIcon v-else-if="category === 'Hands'" />
                <HeartIcon v-else />
              </span>
              <span>{{ $t(`categories.${category}`) }}</span>
            </button>
          </li>
        </ul>
      </template>

      <StateMessage v-else-if="pool.length === 0">
        {{ $t('activity.empty') }}
        <template #action>
          <TextButton @click="excluded = []">
            {{ $t('counterbalance.prompt') }}
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
import { useActivities, CATEGORY_ID_MAP } from '../composables/useActivities.js'
import {
  useSuggestionFlow,
  excludedCategoriesState,
} from '../composables/useSuggestionFlow.js'
import ActivityCard from '../components/ActivityCard.vue'
import TextButton from '../components/TextButton.vue'
import StateLoading from '../components/StateLoading.vue'
import StateError from '../components/StateError.vue'
import StateMessage from '../components/StateMessage.vue'
import SuggestionAccepted from '../components/SuggestionAccepted.vue'
import PageShell from '../components/PageShell.vue'
import PageHeader from '../components/PageHeader.vue'
import HeadIcon from '../components/icons/HeadIcon.vue'
import HandsIcon from '../components/icons/HandsIcon.vue'
import HeartIcon from '../components/icons/HeartIcon.vue'

const router = useRouter()
const categories = Object.keys(CATEGORY_ID_MAP)

const { loaded, error, fetchActivities, filterByExcludedCategories } =
  useActivities()

const excluded = excludedCategoriesState

const pool = computed(() =>
  excluded.value.length > 0 ? filterByExcludedCategories(excluded.value) : []
)

const { current, accepted, next, handleAccept, handleSkip } = useSuggestionFlow({
  mode: 'mode3',
  pool,
})

function handleBack() {
  if (excluded.value.length > 0) {
    excluded.value = []
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
