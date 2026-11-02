<template>
  <div
    v-if="needRefresh"
    role="status"
    aria-live="polite"
    class="fixed bottom-4 left-4 right-4 z-30 mx-auto max-w-[420px] flex items-center gap-3 rounded-2xl border border-uw-border-soft px-4 py-3"
    :style="{ background: 'var(--uw-card, rgba(255,255,255,0.97))' }"
    data-test="update-toast"
  >
    <p class="flex-1 text-sm text-uw-ink m-0">{{ $t('pwa.updateAvailable') }}</p>
    <button
      type="button"
      class="uw-text-button"
      data-test="update-later"
      @click="needRefresh = false"
    >
      {{ $t('pwa.later') }}
    </button>
    <button
      type="button"
      class="uw-text-button"
      data-test="update-now"
      @click="updateServiceWorker()"
    >
      {{ $t('pwa.reload') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'

const HOUR_IN_MS = 60 * 60 * 1000

// An installed PWA can stay open for days without a navigation, which is the
// only moment the browser checks for a new sw.js on its own.
const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegisteredSW(_url, registration) {
    if (!registration) return
    setInterval(() => registration.update(), HOUR_IN_MS)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') registration.update()
    })
  },
})
</script>
