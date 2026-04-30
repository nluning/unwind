<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M10 16 L 3.5 9.5 a 3.8 3.8 0 0 1 5.4 -5.4 L 10 5.2 l 1.1 -1.1 a 3.8 3.8 0 0 1 5.4 5.4 Z" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{ size?: number | string; strokeWidth?: number | string }>(),
  { size: 18, strokeWidth: 1.5 },
)
</script>
