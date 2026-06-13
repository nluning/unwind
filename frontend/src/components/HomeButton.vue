<template>
  <button
    class="uw-home-btn fixed top-[18px] left-[22px] z-20"
    :aria-label="$t('nav.suggest')"
    @click="goHome"
  >
    <HomeIcon :size="18" />
  </button>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import HomeIcon from './icons/HomeIcon.vue'

const router = useRouter()

// Always returns to the hub by name, never history-based — a cold-launched
// standalone PWA can have history.length === 1 and trap the user (report 009 §1).
function goHome() {
  router.push({ name: 'suggest' })
}
</script>
