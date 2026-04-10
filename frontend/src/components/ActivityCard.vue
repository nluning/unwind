<template>
  <div class="flex flex-col gap-4 p-6 rounded-2xl bg-card shadow-md max-w-96 w-full">
    <h2 class="text-xl">{{ $t(`activities.${slug}.title`, activity.title) }}</h2>

    <p v-if="activity.description" class="text-dim text-sm leading-relaxed">
      {{ $t(`activities.${slug}.description`, activity.description) }}
    </p>

    <div class="flex flex-wrap justify-end gap-2">
      <span class="px-3 py-1 bg-chip rounded-full text-xs text-dim">
        {{ $t('activity.duration', { minutes: activity.suggested_duration }) }}
      </span>
      <span v-for="cat in activity.categories" :key="cat" class="px-3 py-1 bg-chip rounded-full text-xs text-dim">
        {{ $t(`categories.${cat}`, cat) }}
      </span>
    </div>

    <div class="flex gap-3 mt-2">
      <button class="flex-1 py-3.5 rounded-lg text-base cursor-pointer border-none bg-primary text-white" @click="$emit('accept')">
        {{ $t('activity.accept') }}
      </button>
      <button class="flex-1 py-3.5 rounded-lg text-base cursor-pointer bg-transparent border border-outline text-dim" @click="$emit('skip')">
        {{ $t('activity.skip') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Activity } from '../types/activity.js'

const props = defineProps<{
  activity: Activity
}>()

defineEmits<{
  accept: []
  skip: []
}>()

const slug = computed(() =>
  props.activity.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
)
</script>
