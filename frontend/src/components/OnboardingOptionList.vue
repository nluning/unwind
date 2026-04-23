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
        <svg
          v-if="option.value === modelValue"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="3 8 6.5 11.5 13 5" />
        </svg>
      </button>
    </li>
  </ul>
</template>

<script setup lang="ts">
defineProps<{
  options: Array<{ value: string; label: string }>
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
