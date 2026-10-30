<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{ size?: number | string; strokeWidth?: number | string }>(),
  { size: 32, strokeWidth: 2.5 },
)
</script>
