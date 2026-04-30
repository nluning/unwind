<template>
  <label class="flex flex-col gap-1.5">
    <span class="text-xs text-uw-ink-mute">{{ label }}</span>
    <textarea
      v-if="multiline"
      :value="modelValue"
      :rows="rows"
      class="uw-input resize-none"
      v-bind="$attrs"
      @input="handleInput"
    />
    <input
      v-else
      :value="modelValue"
      :type="type"
      class="uw-input"
      v-bind="$attrs"
      @input="handleInput"
    />
  </label>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    label: string
    modelValue: string | number | null
    type?: string
    multiline?: boolean
    rows?: number
  }>(),
  { type: 'text', multiline: false, rows: 3 },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
</script>
