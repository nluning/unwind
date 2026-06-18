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
// Presentational 1–5 stress picker shared by StressPage (pick-and-go) and the
// Suggest filter panel (optional filter). With `clearable`, tapping the already
// selected level clears it back to null — needed when the level is an optional
// filter rather than a required choice.
const props = withDefaults(
  defineProps<{
    modelValue: number | null
    clearable?: boolean
    // 'serif' keeps the large StressPage numerals; 'sans' matches the
    // category pills in the filter panel.
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
