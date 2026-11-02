<template>
  <div
    v-if="!isOnline"
    role="status"
    aria-live="polite"
    class="fixed top-3 left-1/2 -translate-x-1/2 z-30 rounded-full border border-uw-border-soft px-3 py-1 text-xs text-uw-ink-mute"
    :style="{ background: 'var(--uw-card, rgba(255,255,255,0.97))' }"
    data-test="offline-indicator"
  >
    {{ $t('pwa.offline') }}
  </div>
</template>

<script setup lang="ts">
import { useOnline } from '../composables/useOnline.js'

const { isOnline } = useOnline()
</script>
