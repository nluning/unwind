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

    <span v-if="wordmark" class="uw-wordmark">unwind</span>

    <div v-if="back" class="w-[34px]" aria-hidden="true" />
  </header>
</template>

<script setup lang="ts">
import BackIcon from './icons/BackIcon.vue'

// `wordmark` shows the "unwind" logo — only the hub (/suggest) sets it now;
// spokes get a clean, empty header (the home button + hamburger carry the chrome).
withDefaults(
  defineProps<{ back?: boolean; wordmark?: boolean }>(),
  { back: false, wordmark: false },
)

const emit = defineEmits<{
  back: []
}>()
</script>
