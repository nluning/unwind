<template>
  <div
    class="fixed bottom-0 left-0 right-0 z-10"
    :style="{ paddingBottom: 'env(safe-area-inset-bottom)' }"
  >
    <nav class="uw-nav max-w-md mx-auto" :aria-label="t('nav.label')">
      <router-link
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        v-slot="{ isExactActive, href, navigate }"
        custom
      >
        <a
          :href="href"
          class="uw-nav__item"
          :class="{ 'uw-nav__item--active': isExactActive }"
          @click="navigate"
        >
          {{ tab.label() }}
        </a>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const tabs = [
  { label: () => t('nav.suggest'), to: '/suggest' },
  { label: () => t('nav.chat'), to: '/chat' },
] as const
</script>
