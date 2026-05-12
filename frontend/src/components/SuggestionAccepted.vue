<template>
  <div class="flex-1 flex flex-col">
    <div class="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <p class="text-2xl font-serif text-uw-primary">
        {{ $t('suggest.accepted') }}
      </p>
    </div>

    <div class="mb-12 px-[22px]">
      <button class="uw-actions__secondary" @click="$emit('back')">
        <ForwardIcon class="-scale-x-100" />
        {{ $t('nav.back') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import ForwardIcon from './icons/ForwardIcon.vue'

defineEmits<{
  back: []
}>()
</script>
