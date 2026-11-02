<template>
  <div class="flex-1 flex flex-col">
    <div class="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <p class="text-2xl font-serif text-uw-primary">
        {{ $t('suggest.accepted') }}
      </p>
    </div>

    <div class="uw-actions mb-12">
      <button class="uw-actions__secondary" @click="$emit('back')">
        <ForwardIcon class="-scale-x-100" />
        {{ $t('nav.back') }}
      </button>

      <!-- "Klaar": the user says they've done it, so ask how it went right away
           instead of waiting for the next app open. -->
      <button
        v-if="canFinish"
        class="uw-actions__primary"
        data-test="done"
        @click="openForLastAccepted"
      >
        <span class="uw-badge" aria-hidden="true">
          <CheckIcon />
        </span>
        {{ $t('suggest.done') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import ForwardIcon from './icons/ForwardIcon.vue'
import CheckIcon from './icons/CheckIcon.vue'
import { usePostActivityFeedback } from '../composables/usePostActivityFeedback.js'

defineEmits<{
  back: []
}>()

const { canFinish, openForLastAccepted } = usePostActivityFeedback()
</script>
