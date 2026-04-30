<template>
  <ul
    class="flex flex-col list-none border-t border-b border-uw-border-soft"
    role="list"
  >
    <li
      v-for="(option, index) in options"
      :key="option.value"
      :class="index > 0 ? 'border-t border-uw-border-soft' : ''"
    >
      <button
        class="w-full py-[18px] bg-transparent border-0 font-serif text-xl leading-tight tracking-[-0.2px] text-left cursor-pointer flex items-center justify-between transition-colors"
        :class="option.value === modelValue ? 'text-uw-primary' : 'text-uw-ink'"
        @click="$emit('update:modelValue', option.value)"
      >
        <span>{{ option.label }}</span>
        <CheckIcon
          v-if="option.value === modelValue"
          :stroke-width="1.8"
        />
      </button>
    </li>
  </ul>
</template>

<script setup lang="ts">
import CheckIcon from './icons/CheckIcon.vue'

defineProps<{
  options: Array<{ value: string; label: string }>
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
