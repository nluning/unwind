<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import BottomNav from './components/BottomNav.vue'
import UserMenu from './components/UserMenu.vue'

const route = useRoute()
const showNav = computed(() => route.meta.public !== true && route.meta.onboarding !== true)
</script>

<template>
  <div :class="showNav ? 'pb-20' : ''">
    <div v-if="showNav" class="fixed top-3 right-3 z-10">
      <UserMenu />
    </div>
    <RouterView />
  </div>
  <BottomNav v-if="showNav" />
</template>
