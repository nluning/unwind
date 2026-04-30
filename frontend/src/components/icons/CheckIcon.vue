<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <polyline points="3 8 6.5 11.5 13 5" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{ size?: number | string; strokeWidth?: number | string }>(),
  { size: 16, strokeWidth: 2 },
)
</script>
