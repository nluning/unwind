<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import UserMenu from './components/UserMenu.vue'
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
</script>

<template>
  <div>
    <RouterView />
    <UserMenu v-if="showChrome" />
    <MenuHintTooltip v-if="showChrome && showMenuHint" />
  </div>
</template>
