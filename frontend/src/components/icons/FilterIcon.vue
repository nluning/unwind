<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M2.25 3.5a.75.75 0 0 1 .75-.75h10a.75.75 0 0 1 .58 1.23L9.75 8.77V13a.75.75 0 0 1-1.13.65l-2-1.2a.75.75 0 0 1-.37-.65V8.77L2.42 3.98A.75.75 0 0 1 2.25 3.5Z" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number | string }>(), { size: 16 })
</script>
