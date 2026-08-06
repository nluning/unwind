<template>
  <PageShell>
    <PageHeader />

    <p class="uw-prompt">{{ $t('suggestFromList.heading') }}</p>

    <!-- Intro — explicit generate, so navigating here never auto-spends a call. -->
    <template v-if="!hasResult && !loading && !failed">
      <p class="uw-body">{{ $t('suggestFromList.intro') }}</p>
      <div class="mt-auto mb-12 px-[22px] flex justify-end">
        <button data-test="generate" class="uw-actions__primary" @click="handleGenerate">
          {{ $t('suggestFromList.generate') }}
        </button>
      </div>
    </template>

    <StateLoading v-else-if="loading" />

    <template v-else-if="failed">
      <StateMessage v-if="rateLimitMessage">{{ rateLimitMessage }}</StateMessage>
      <StateError v-else @retry="handleGenerate" />
    </template>

    <template v-else>
      <SuggestionList
        :key="generation"
        :suggestions="suggestions"
        :save="save"
        class="px-6 pb-4 mt-2"
      />

      <div class="px-6 pb-8 flex justify-center">
        <button data-test="regenerate" class="uw-text-button text-sm" @click="handleGenerate">
          {{ $t('suggestFromList.regenerate') }}
        </button>
      </div>
    </template>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSuggestFromList } from '../composables/useSuggestFromList.js'
import PageShell from '../components/PageShell.vue'
import PageHeader from '../components/PageHeader.vue'
import StateLoading from '../components/StateLoading.vue'
import StateError from '../components/StateError.vue'
import StateMessage from '../components/StateMessage.vue'
import SuggestionList from '../components/SuggestionList.vue'

const { suggestions, loading, failed, rateLimitMessage, generate, save } = useSuggestFromList()

const hasResult = computed(() => suggestions.value.length > 0)

// Bumped on each generation so SuggestionList remounts with fresh save markers —
// a new batch reuses the same indices but they point at different activities.
const generation = ref(0)

async function handleGenerate() {
  generation.value++
  await generate()
}
</script>
