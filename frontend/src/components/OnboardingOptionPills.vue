<template>
  <div class="px-7 flex flex-wrap gap-2">
    <ToggleButton
      v-for="option in options"
      :key="option.value"
      data-test="pill"
      :selected="option.value === modelValue"
      @click="$emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </ToggleButton>
  </div>
</template>

<script setup lang="ts">
import ToggleButton from './ToggleButton.vue'

defineProps<{
  options: Array<{ value: string; label: string }>
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
