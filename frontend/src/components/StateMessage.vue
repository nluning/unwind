<template>
  <div
    class="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center"
  >
    <p :class="textClasses">
      <slot />
    </p>
    <slot name="action" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{ variant?: 'muted' | 'accent' }>(),
  { variant: 'muted' },
)

const textClasses = computed(() =>
  props.variant === 'accent'
    ? 'text-2xl font-serif text-uw-primary'
    : 'text-sm text-uw-ink-mute',
)
</script>
