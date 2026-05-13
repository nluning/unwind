<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
  >
    <rect x="2.5" y="2.25" width="11" height="1.5" rx="0.75" />
    <rect x="2.5" y="7.25" width="11" height="1.5" rx="0.75" />
    <rect x="2.5" y="12.25" width="11" height="1.5" rx="0.75" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number | string }>(), { size: 16 })
</script>
