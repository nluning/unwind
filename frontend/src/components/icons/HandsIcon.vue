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
    <path d="M6 11 V 5 a 1.2 1.2 0 0 1 2.4 0 V 9 M 8.4 9 V 3.5 a 1.2 1.2 0 0 1 2.4 0 V 9 M 10.8 9 V 4 a 1.2 1.2 0 0 1 2.4 0 V 10 M 13.2 10 V 6 a 1.2 1.2 0 0 1 2.4 0 V 12 a 5 5 0 0 1 -9.6 1 L 4.5 10 a 1 1 0 0 1 1.5 -1" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{ size?: number | string; strokeWidth?: number | string }>(),
  { size: 18, strokeWidth: 1.5 },
)
</script>
