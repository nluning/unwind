<template>
  <div
    class="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center"
  >
    <p class="text-sm text-uw-ink-mute">
      <slot>{{ $t('suggest.error') }}</slot>
    </p>
    <TextButton @click="emit('retry')">
      <slot name="action">{{ $t('suggest.retry') }}</slot>
    </TextButton>
  </div>
</template>

<script setup lang="ts">
import TextButton from './TextButton.vue'

const emit = defineEmits<{ retry: [] }>()
</script>
