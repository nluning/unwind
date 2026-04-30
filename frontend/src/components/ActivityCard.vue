<template>
  <div class="flex-1 flex flex-col gap-4">
    <h1 class="uw-title">
      {{ $t(`activities.${slug}.title`, activity.title) }}
    </h1>

    <p v-if="activity.description" class="uw-body">
      {{ $t(`activities.${slug}.description`, activity.description) }}
    </p>

    <div class="uw-chips">
      <span class="uw-chip">
        {{ $t('activity.duration', { minutes: activity.suggested_duration }) }}
      </span>
      <span
        v-for="category in activity.categories"
        :key="category"
        class="uw-chip"
      >
        {{ $t(`categories.${category}`, category) }}
      </span>
    </div>

    <div class="uw-actions mt-auto mb-20">
      <button class="uw-actions__primary" @click="$emit('accept')">
        <span class="uw-badge" aria-hidden="true">
          <CheckIcon />
        </span>
        {{ $t('activity.accept') }}
      </button>

      <button class="uw-actions__secondary" @click="$emit('skip')">
        {{ $t('activity.skip') }}
        <ForwardIcon />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Activity } from '../types/activity.js'
import CheckIcon from './icons/CheckIcon.vue'
import ForwardIcon from './icons/ForwardIcon.vue'

const props = defineProps<{
  activity: Activity
}>()

defineEmits<{
  accept: []
  skip: []
}>()

const slug = computed(() =>
  props.activity.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
)
</script>
