<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M6 1 a 7 7 0 1 0 9 9 A 6 6 0 0 1 6 1 Z" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number | string }>(), { size: 12 })
</script>
