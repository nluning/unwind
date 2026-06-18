<template>
  <div>
    <div class="flex justify-between items-center">
      <button
        v-for="level in 5"
        :key="level"
        class="w-12 h-12 rounded-full border border-uw-border bg-transparent text-uw-ink text-lg cursor-pointer transition-colors hover:bg-uw-chip"
        :class="[
          font === 'serif' ? 'font-serif' : 'font-medium',
          {
            'bg-uw-primary text-uw-primary-fg border-transparent':
              modelValue === level,
          },
        ]"
        @click="select(level)"
      >
        {{ level }}
      </button>
    </div>
    <div class="flex justify-between mt-3 text-xs text-uw-ink-mute">
      <span>{{ $t('stress.low') }}</span>
      <span>{{ $t('stress.high') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: number | null
    // When set, tapping the selected level clears it back to null.
    clearable?: boolean
    font?: 'serif' | 'sans'
  }>(),
  { clearable: false, font: 'serif' },
)

const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()

function select(level: number) {
  if (props.clearable && props.modelValue === level) {
    emit('update:modelValue', null)
  } else {
    emit('update:modelValue', level)
  }
}
</script>
