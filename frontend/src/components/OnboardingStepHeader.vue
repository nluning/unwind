<template>
  <div class="px-7 pt-14 flex flex-col gap-3">
    <span class="font-serif text-[17px] text-uw-ink-mute">
      {{ $t('onboarding.questionOf', { n: questionNumber, total: 5 }) }}
    </span>
    <h2
      class="font-serif text-[28px] leading-[1.22] tracking-[-0.4px] text-uw-ink"
    >
      {{ title }}
    </h2>
    <span v-if="$slots.hint" class="text-[13px] text-uw-ink-mute">
      <slot name="hint" />
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  questionNumber: number
  title: string
}>()
</script>
