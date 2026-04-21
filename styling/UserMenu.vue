<template>
  <transition name="uw-menu-fade">
    <div v-if="open" class="uw-menu-scrim" @click.self="$emit('close')">
      <aside class="uw-menu" role="dialog" aria-modal="true">
        <header class="uw-menu__header">
          <span class="uw-wordmark">unwind</span>
          <button class="uw-menu-btn" :aria-label="$t('menu.close')" @click="$emit('close')">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4 L12 12 M12 4 L4 12"/></svg>
          </button>
        </header>

        <div class="uw-menu__section">
          <span class="uw-menu__label">{{ $t('menu.theme') }}</span>
          <div class="uw-theme-row">
            <button
              v-for="t in themes"
              :key="t.id"
              class="uw-swatch"
              :class="{ 'is-active': scheme === t.id }"
              :style="{ background: t.swatch, color: t.fg }"
              :aria-label="t.label"
              :aria-pressed="scheme === t.id"
              @click="setScheme(t.id)"
            >
              <svg v-if="scheme === t.id" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 8 6.5 11.5 13 5"/></svg>
            </button>
          </div>
        </div>

        <nav class="uw-menu__nav">
          <router-link to="/" class="uw-menu__link" @click="$emit('close')">{{ $t('menu.home') }}</router-link>
          <router-link to="/stress" class="uw-menu__link" @click="$emit('close')">{{ $t('menu.stress') }}</router-link>
          <router-link to="/counterbalance" class="uw-menu__link" @click="$emit('close')">{{ $t('menu.counterbalance') }}</router-link>
          <router-link to="/saved" class="uw-menu__link" @click="$emit('close')">{{ $t('menu.saved') }}</router-link>
          <router-link to="/settings" class="uw-menu__link" @click="$emit('close')">{{ $t('menu.settings') }}</router-link>
        </nav>

        <footer class="uw-menu__foot">
          <button class="uw-menu__linkout" @click="$emit('signout')">{{ $t('menu.signout') }}</button>
        </footer>
      </aside>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useTheme } from '../composables/useTheme.js'
import { useI18n } from 'vue-i18n'

defineProps<{ open: boolean }>()
defineEmits(['close', 'signout'])

const { t } = useI18n()
const { colorScheme: scheme, setColorScheme: setScheme } = useTheme()

const themes = [
  { id: 'warm',    label: t('menu.themeWarm'),    swatch: 'linear-gradient(145deg,#ecdcc4,#a4614d)', fg: '#fbefe0' },
  { id: 'calm',    label: t('menu.themeCalm'),    swatch: 'linear-gradient(145deg,#e4ecec,#3f6670)', fg: '#e9f2f2' },
  { id: 'playful', label: t('menu.themePlayful'), swatch: 'linear-gradient(145deg,#f0cf9d,#3d7a4a)', fg: '#f6f3e9' },
]
</script>

<style scoped>
.uw-menu-scrim {
  position: fixed; inset: 0; z-index: 60;
  background: rgba(20,16,12,0.28);
  display: flex; justify-content: flex-end;
}
.uw-menu {
  width: min(320px, 86vw);
  background: var(--uw-bg);
  color: var(--uw-ink);
  padding: 18px 22px 24px;
  display: flex; flex-direction: column; gap: 24px;
  box-shadow: -12px 0 40px rgba(0,0,0,0.18);
}

.uw-menu__header { display: flex; justify-content: space-between; align-items: center; }

.uw-menu__section { display: flex; flex-direction: column; gap: 10px; }
.uw-menu__label {
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px;
  color: var(--uw-ink-mute);
}
.uw-theme-row { display: flex; gap: 10px; }
.uw-swatch {
  width: 42px; height: 42px; border-radius: 14px; border: 0; padding: 0;
  cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.08);
  transition: transform 120ms ease;
}
.uw-swatch.is-active { transform: scale(1.06); }

.uw-menu__nav { display: flex; flex-direction: column; margin-top: 4px; }
.uw-menu__link {
  padding: 14px 0;
  font-family: var(--uw-font-serif);
  font-size: 20px; font-weight: 400; letter-spacing: -0.2px;
  color: var(--uw-ink);
  text-decoration: none;
  border-bottom: 1px solid var(--uw-border-soft);
}
.uw-menu__link:first-of-type { border-top: 1px solid var(--uw-border-soft); }
.uw-menu__link.router-link-active { color: var(--uw-primary); }

.uw-menu__foot { margin-top: auto; }
.uw-menu__linkout {
  border: 0; background: transparent; padding: 0;
  color: var(--uw-ink-mute); font-size: 14px; cursor: pointer;
}

.uw-menu-fade-enter-from, .uw-menu-fade-leave-to { opacity: 0; }
.uw-menu-fade-enter-from .uw-menu,
.uw-menu-fade-leave-to .uw-menu { transform: translateX(20px); }
.uw-menu-fade-enter-active, .uw-menu-fade-leave-active { transition: opacity 160ms ease; }
.uw-menu-fade-enter-active .uw-menu,
.uw-menu-fade-leave-active .uw-menu { transition: transform 200ms ease; }
</style>
