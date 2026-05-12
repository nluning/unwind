<template>
  <section
    class="flex-1 flex flex-col"
    role="region"
    :aria-label="$t('welcome.heading')"
  >
    <header class="uw-header">
      <span class="uw-wordmark text-uw-ink-mute">unwind</span>
    </header>

    <div class="flex-1 flex flex-col justify-center px-[26px]">
      <h1
        class="font-serif text-uw-ink leading-[1.15] tracking-[-0.6px] text-[38px] max-w-[300px]"
      >
        {{ $t('welcome.heading') }}
      </h1>
      <p class="text-uw-ink-soft text-[17px] leading-[1.55] mt-6 max-w-[320px]">
        {{ $t('welcome.body') }}
      </p>
    </div>

    <div class="mb-16 px-[26px] flex justify-end">
      <button class="uw-actions__primary" @click="$emit('dismiss')">
        {{ $t('welcome.dismiss') }}
        <span class="uw-badge">
          <ForwardIcon />
        </span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import ForwardIcon from './icons/ForwardIcon.vue'

defineEmits<{
  dismiss: []
}>()
</script>
