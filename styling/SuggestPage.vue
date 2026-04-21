<!--
  SuggestPage.vue
  Home screen · Chrome B (inline verbs) + per-theme accents.
  Relies on tokens defined in src/assets/base.css.

  Expected state (keep your existing composables / stores — this snippet
  only changes the template + scoped styles):
    - suggestion.title        string  e.g. "Stretch tien minuten"
    - suggestion.description  string
    - suggestion.duration     string  e.g. "10 min"
    - suggestion.category     string  e.g. "Handen"
    - onDoen()                void
    - onVolgende()            void
    - openMenu()              void
    - activeTab               'suggest' | 'chat'
    - goTo(tab)               void
-->

<template>
  <div class="uw-screen">
    <!-- Optional playful wash (harmless on warm/cool, controlled by theme) -->
    <div class="uw-screen__wash" aria-hidden="true" />
    <div class="uw-screen__glow" aria-hidden="true" />

    <!-- Wordmark + menu -->
    <header class="uw-header">
      <span class="uw-wordmark">unwind</span>
      <button
        class="uw-menu-btn"
        :aria-label="t('menu.open')"
        @click="openMenu"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <circle cx="8" cy="3"  r="1.4" />
          <circle cx="8" cy="8"  r="1.4" />
          <circle cx="8" cy="13" r="1.4" />
        </svg>
      </button>
    </header>

    <!-- Prompt -->
    <p class="uw-prompt">{{ t('suggest.prompt') }}</p>

    <!-- Activity -->
    <h1 class="uw-title">{{ suggestion.title }}</h1>
    <p  class="uw-body">{{ suggestion.description }}</p>

    <div class="uw-chips">
      <span class="uw-chip">{{ suggestion.duration }}</span>
      <span class="uw-chip">{{ suggestion.category }}</span>
    </div>

    <!-- Actions -->
    <div class="uw-actions">
      <button class="uw-actions__primary" @click="onDoen">
        <span class="uw-badge" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
               stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 8 6.5 11.5 13 5" />
          </svg>
        </span>
        {{ t('suggest.doen') }}
      </button>

      <button class="uw-actions__secondary" @click="onVolgende">
        {{ t('suggest.volgende') }}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
             stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
             aria-hidden="true">
          <path d="M3 8 h 10 M 9 4 l 4 4 -4 4" />
        </svg>
      </button>
    </div>

    <!-- Bottom nav -->
    <nav class="uw-nav" :aria-label="t('nav.label')">
      <button
        class="uw-nav__item"
        :class="{ 'uw-nav__item--active': activeTab === 'suggest' }"
        @click="goTo('suggest')"
      >{{ t('nav.suggest') }}</button>
      <button
        class="uw-nav__item"
        :class="{ 'uw-nav__item--active': activeTab === 'chat' }"
        @click="goTo('chat')"
      >{{ t('nav.chat') }}</button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

// Wire these to your real stores / composables.
defineProps<{
  suggestion: {
    title: string;
    description: string;
    duration: string;
    category: string;
  };
  activeTab: 'suggest' | 'chat';
}>();

const emit = defineEmits<{
  (e: 'doen'): void;
  (e: 'volgende'): void;
  (e: 'openMenu'): void;
  (e: 'goTo', tab: 'suggest' | 'chat'): void;
}>();

const { t } = useI18n();

const onDoen     = () => emit('doen');
const onVolgende = () => emit('volgende');
const openMenu   = () => emit('openMenu');
const goTo       = (tab: 'suggest' | 'chat') => emit('goTo', tab);
</script>

<!--
  No scoped styles needed — everything lives in base.css.
  If you want page-specific tweaks, add them in a scoped <style> block here
  so the shared system stays clean.
-->
