<template>
  <ul class="flex flex-col gap-3">
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

      <div class="uw-chips !px-0 !pt-1">
        <span class="uw-chip">
          {{ $t('activity.duration', { minutes: suggestion.duration_minutes }) }}
        </span>
        <span class="uw-chip">
          {{ $t(`categories.${suggestion.category}`, suggestion.category) }}
        </span>
      </div>

      <div class="flex justify-between items-center mt-1 min-h-[40px]">
        <span>
          <button
            v-if="saved.has(index) && !done.has(index)"
            class="uw-actions__primary text-sm"
            @click="handleAccept(index)"
          >
            <span class="uw-badge" aria-hidden="true">
              <CheckIcon />
            </span>
            {{ $t('activity.accept') }}
          </button>
          <span
            v-else-if="done.has(index)"
            class="text-sm text-uw-primary"
          >
            {{ $t('suggest.accepted') }}
          </span>
        </span>

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
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { api } from '../api/client.js'
import type { Activity } from '../types/activity.js'
import type { AiActivity } from '../utils/parseActivity.js'
import CheckIcon from './icons/CheckIcon.vue'

const props = defineProps<{
  suggestions: AiActivity[]
  // Persists the chosen suggestion and returns the created activity. Owned by
  // the caller (the suggest-from-list composable) so this stays presentational.
  save: (activity: AiActivity) => Promise<Activity>
}>()

// index → the activity row created when it was added (we need its id for "Doen").
const saved = ref<Map<number, Activity>>(new Map())
const saving = ref<number | null>(null)
const done = ref<Set<number>>(new Set())

async function handleSave(index: number, activity: AiActivity) {
  saving.value = index
  try {
    const created = await props.save(activity)
    saved.value = new Map([...saved.value, [index, created]])
  } catch {
    // Leave the button so the user can retry.
  } finally {
    saving.value = null
  }
}

function handleAccept(index: number) {
  const activity = saved.value.get(index)
  if (!activity) return
  done.value = new Set([...done.value, index])
  // Best-effort signal for the suggestion-weighting / AI context. Mirrors the
  // usage event the suggest page logs on accept. `mode` is a legacy-required
  // field on usage_events (the old multi-mode concept); the value is no longer
  // meaningful, so we send the hub's 'mode1'.
  api('/usage-events', {
    method: 'POST',
    body: JSON.stringify({ activity_id: activity.id, action: 'accepted', mode: 'mode1' }),
  }).catch(() => {})
}
</script>
