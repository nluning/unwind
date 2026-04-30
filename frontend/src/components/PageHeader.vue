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

    <button
      v-if="right === 'reset'"
      class="uw-menu-btn"
      :aria-label="$t('chat.newChat')"
      @click="emit('reset')"
    >
      <PlusIcon />
    </button>
    <div v-else-if="back" class="w-[34px]" aria-hidden="true" />
  </header>
</template>

<script setup lang="ts">
import BackIcon from './icons/BackIcon.vue'
import PlusIcon from './icons/PlusIcon.vue'

withDefaults(
  defineProps<{ back?: boolean; right?: 'spacer' | 'reset' }>(),
  { back: false, right: 'spacer' },
)

const emit = defineEmits<{
  back: []
  reset: []
}>()
</script>
