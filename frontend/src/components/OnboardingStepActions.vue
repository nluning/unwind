<template>
  <div class="mt-auto mb-12 px-[22px] flex items-center justify-between">
    <button class="uw-text-button" data-test="back" @click="$emit('back')">
      {{ $t('onboarding.back') }}
    </button>
    <button
      v-if="showContinue"
      class="uw-actions__primary"
      data-test="continue"
      @click="$emit('continue')"
    >
      {{ $t('onboarding.continue') }}
      <span class="uw-badge">
        <ForwardIcon />
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import ForwardIcon from './icons/ForwardIcon.vue'

defineProps<{
  showContinue: boolean
}>()

defineEmits<{
  back: []
  continue: []
}>()
</script>
