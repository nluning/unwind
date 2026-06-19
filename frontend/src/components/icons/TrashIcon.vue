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
    <path d="M3 4h10" />
    <path d="M6 4V2.5h4V4" />
    <path d="M4.5 4l.6 9a.8.8 0 0 0 .8.75h4.2a.8.8 0 0 0 .8-.75L11.5 4" />
    <path d="M6.8 6.8v4.2M9.2 6.8v4.2" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{ size?: number | string; strokeWidth?: number | string }>(),
  { size: 20, strokeWidth: 1.6 },
)
</script>
