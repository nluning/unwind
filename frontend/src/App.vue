<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import BottomNav from './components/BottomNav.vue'
import UserMenu from './components/UserMenu.vue'

const route = useRoute()
const showNav = computed(() => route.meta.public !== true && route.meta.onboarding !== true)
const isImmersive = computed(() => route.meta.immersive === true)
</script>

<template>
  <div :class="showNav && !isImmersive ? 'pb-20' : ''">
    <div v-if="showNav && !isImmersive" class="fixed top-3 right-3 z-10">
      <UserMenu />
    </div>
    <RouterView />
  </div>
  <BottomNav v-if="showNav && !isImmersive" />
</template>
