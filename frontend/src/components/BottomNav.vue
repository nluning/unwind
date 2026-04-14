<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const tabs = [
  { label: () => t('nav.suggest'), to: '/suggest' },
  { label: () => t('nav.stress'), to: '/stress' },
  { label: () => t('nav.counterbalance'), to: '/counterbalance' },
  { label: () => t('nav.chat'), to: '/chat' },
] as const
</script>

<template>
  <nav :aria-label="t('nav.label')" class="fixed bottom-0 left-0 right-0 flex bg-surface border-t border-outline">
    <router-link
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      v-slot="{ isExactActive, href, navigate }"
      custom
    >
      <a
        :href="href"
        @click="navigate"
        class="flex-1 flex items-center justify-center min-h-14 text-sm transition-colors"
        :class="isExactActive ? 'text-primary font-600 border-t-2 border-primary' : 'text-muted'"
      >
        {{ tab.label() }}
      </a>
    </router-link>
  </nav>
</template>
