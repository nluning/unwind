<template>
  <div
    role="status"
    aria-live="polite"
    class="fixed top-[62px] right-[16px] z-30 pointer-events-none w-[230px] rounded-[18px] rounded-tr-[6px] flex items-start gap-2 px-3.5 py-2.5"
    :style="{
      background: 'var(--uw-card, rgba(255,255,255,0.96))',
      boxShadow: '0 10px 30px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)',
    }"
  >
    <p class="flex-1 text-sm text-uw-ink leading-snug">
      {{ $t('menu.hint') }}
    </p>
    <button
      type="button"
      class="hidden md:flex pointer-events-auto flex-shrink-0 w-5 h-5 -mt-0.5 -mr-1 items-center justify-center bg-transparent border-0 cursor-pointer text-base leading-none text-uw-ink-mute hover:text-uw-ink"
      :aria-label="$t('menu.close')"
      @click="dismissMenuHint"
    >
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useWelcome } from '../composables/useWelcome.js'

const { dismissMenuHint } = useWelcome()

function handleClick() {
  dismissMenuHint()
}

let registered = false

onMounted(() => {
  // Defer one tick so the WelcomeCard's dismiss click doesn't immediately
  // close us — that same click is still bubbling when we mount.
  setTimeout(() => {
    document.addEventListener('click', handleClick)
    registered = true
  }, 0)
})

onBeforeUnmount(() => {
  if (registered) document.removeEventListener('click', handleClick)
})
</script>
