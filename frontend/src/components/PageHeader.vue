<template>
  <header class="uw-header">
    <button
      v-if="back"
      class="uw-menu-btn"
      :aria-label="$t('nav.back')"
      @click="emit('back')"
    >
      <BackIcon />
    </button>

    <span class="uw-wordmark">unwind</span>

    <div v-if="back" class="w-[34px]" aria-hidden="true" />
  </header>
</template>

<script setup lang="ts">
import BackIcon from './icons/BackIcon.vue'

withDefaults(
  defineProps<{ back?: boolean }>(),
  { back: false },
)

const emit = defineEmits<{
  back: []
}>()
</script>
