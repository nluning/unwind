<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import BottomNav from './components/BottomNav.vue'

const route = useRoute()
const showNav = computed(() => route.meta.public !== true)
</script>

<template>
  <div :class="showNav ? 'pb-20' : ''">
    <RouterView />
  </div>
  <BottomNav v-if="showNav" />
</template>
