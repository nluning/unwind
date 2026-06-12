<template>
  <PageShell>
    <PageHeader />

    <p class="uw-prompt">{{ $t('suggestFromList.heading') }}</p>

    <!-- Intro — explicit generate, so navigating here never auto-spends a call. -->
    <template v-if="!hasResult && !loading && !failed">
      <p class="uw-body">{{ $t('suggestFromList.intro') }}</p>
      <div class="mt-auto mb-12 px-[22px] flex justify-end">
        <button class="uw-actions__primary" @click="handleGenerate">
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
      <ul class="flex flex-col gap-3 px-6 pb-4 mt-2">
        <li
          v-for="(suggestion, index) in suggestions"
          :key="index"
          class="rounded-xl border border-uw-border-soft bg-uw-chip p-4 flex flex-col gap-2"
        >
          <h3 class="font-serif text-lg text-uw-ink leading-snug">
            {{ suggestion.title }}
          </h3>

          <p
            v-if="suggestion.description"
            class="text-sm text-uw-ink-soft"
          >
            {{ suggestion.description }}
          </p>

          <div class="uw-chips">
            <span class="uw-chip">
              {{ $t('activity.duration', { minutes: suggestion.duration_minutes }) }}
            </span>
            <span class="uw-chip">
              {{ $t(`categories.${suggestion.category}`, suggestion.category) }}
            </span>
          </div>

          <div class="flex justify-end mt-1">
            <button
              v-if="!saved.has(index)"
              class="uw-text-button text-sm"
              :disabled="saving === index"
              @click="handleSave(index, suggestion)"
            >
              {{ saving === index ? '…' : $t('suggestFromList.add') }}
            </button>
            <span
              v-else
              class="text-sm text-uw-primary"
            >
              {{ $t('suggestFromList.added') }}
            </span>
          </div>
        </li>
      </ul>

      <div class="px-6 pb-8 flex justify-center">
        <button class="uw-text-button text-sm" @click="handleGenerate">
          {{ $t('suggestFromList.regenerate') }}
        </button>
      </div>
    </template>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSuggestFromList } from '../composables/useSuggestFromList.js'
import type { AiActivity } from '../utils/parseActivity.js'
import PageShell from '../components/PageShell.vue'
import PageHeader from '../components/PageHeader.vue'
import StateLoading from '../components/StateLoading.vue'
import StateError from '../components/StateError.vue'
import StateMessage from '../components/StateMessage.vue'

const { suggestions, loading, failed, rateLimitMessage, generate, save } = useSuggestFromList()

const hasResult = computed(() => suggestions.value.length > 0)
const saved = ref<Set<number>>(new Set())
const saving = ref<number | null>(null)

async function handleGenerate() {
  // Fresh batch → previous saved/saving markers no longer map to these cards.
  saved.value = new Set()
  saving.value = null
  await generate()
}

async function handleSave(index: number, activity: AiActivity) {
  saving.value = index
  try {
    await save(activity)
    saved.value = new Set([...saved.value, index])
  } catch {
    // Leave the button so the user can retry.
  } finally {
    saving.value = null
  }
}
</script>
