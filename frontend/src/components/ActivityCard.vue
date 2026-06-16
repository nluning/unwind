<template>
  <div class="flex-1 flex flex-col gap-4">
    <h1 class="uw-title">
      {{ title }}
    </h1>

    <p v-if="description" class="uw-body" data-test="description">
      {{ description }}
    </p>

    <div class="uw-chips">
      <span class="uw-chip">
        {{ $t('activity.duration', { minutes: activity.suggested_duration }) }}
      </span>
      <!-- <span
        v-for="category in activity.categories"
        :key="category"
        class="uw-chip"
      >
        {{ $t(`categories.${category}`, category) }}
      </span> -->
    </div>

    <div class="uw-actions mt-auto">
      <button class="uw-actions__primary" data-test="accept" @click="$emit('accept')">
        <span class="uw-badge" aria-hidden="true">
          <CheckIcon />
        </span>
        {{ $t('activity.accept') }}
      </button>

      <button class="uw-actions__secondary" data-test="skip" @click="$emit('skip')">
        {{ $t('activity.skip') }}
        <ForwardIcon />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Activity } from '../types/activity.js'
import { useActivityTranslation } from '../composables/useActivityTranslation.js'
import CheckIcon from './icons/CheckIcon.vue'
import ForwardIcon from './icons/ForwardIcon.vue'

const props = defineProps<{
  activity: Activity
}>()

defineEmits<{
  accept: []
  skip: []
}>()

const { titleFor, descriptionFor } = useActivityTranslation()

const title = computed(() => titleFor(props.activity))
const description = computed(() => descriptionFor(props.activity))
</script>
