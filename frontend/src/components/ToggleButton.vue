<template>
  <button
    type="button"
    class="rounded-full border cursor-pointer transition-colors"
    :class="[
      sizeClasses,
      selected
        ? 'bg-uw-primary text-uw-primary-fg border-transparent'
        : 'bg-transparent text-uw-ink border-uw-border',
    ]"
    @click="emit('click')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{ selected?: boolean; size?: 'sm' | 'md' }>(),
  { selected: false, size: 'md' },
)

const emit = defineEmits<{ click: [] }>()

const sizeClasses = computed(() =>
  props.size === 'sm'
    ? 'px-3.5 py-2 text-sm'
    : 'px-3.5 py-2.5 text-[13.5px] font-medium',
)
</script>
