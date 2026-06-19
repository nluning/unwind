<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import UserMenu from './components/UserMenu.vue'
import HomeButton from './components/HomeButton.vue'
import MenuHintTooltip from './components/MenuHintTooltip.vue'
import { useWelcome } from './composables/useWelcome.js'

const route = useRoute()
const { isWelcomed, showMenuHint } = useWelcome()
const showChrome = computed(
  () =>
    route.meta.public !== true &&
    route.meta.onboarding !== true &&
    isWelcomed.value
)
const showHome = computed(
  () => showChrome.value && route.name !== 'suggest' && route.name !== 'chat'
)
</script>

<template>
  <div>
    <RouterView />
    <UserMenu v-if="showChrome" />
    <HomeButton v-if="showHome" />
    <MenuHintTooltip v-if="showChrome && showMenuHint" />
  </div>
</template>
