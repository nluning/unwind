<template>
  <button
    type="button"
    class="confirm-button"
    :class="{ 'is-confirming': confirming }"
    @click="handleClick"
  >
    {{ confirming ? confirmLabel : label }}
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  label: string
  confirmLabel: string
}>()

const emit = defineEmits<{ confirm: [] }>()

const confirming = ref(false)

function handleClick() {
  if (confirming.value) {
    emit('confirm')
    confirming.value = false
  } else {
    confirming.value = true
  }
}
</script>

<style scoped>
.confirm-button {
  color: var(--uw-ink-mute);
  transition: color 0.15s ease, opacity 0.15s ease;
}
.confirm-button:hover {
  color: var(--uw-danger, #b4412a);
}
.confirm-button.is-confirming {
  color: var(--uw-danger, #b4412a);
  font-weight: 600;
}
.confirm-button.is-confirming:hover {
  color: var(--uw-danger, #b4412a);
  opacity: 0.8;
}
</style>
