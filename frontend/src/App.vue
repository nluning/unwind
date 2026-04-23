<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import BottomNav from './components/BottomNav.vue'
import UserMenu from './components/UserMenu.vue'

const route = useRoute()
const showChrome = computed(
  () => route.meta.public !== true && route.meta.onboarding !== true
)
</script>

<template>
  <div :class="showChrome ? 'pb-20' : ''">
    <RouterView />
    <UserMenu v-if="showChrome" />
  </div>
  <BottomNav v-if="showChrome" />
</template>
