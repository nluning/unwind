<template>
  <main class="uw-screen uw-chat" :class="`uw-theme-${theme}`">
    <div v-if="theme === 'playful'" class="uw-screen__wash" aria-hidden="true" />
    <div v-else class="uw-screen__glow" aria-hidden="true" />

    <header class="uw-header">
      <button class="uw-back" :aria-label="$t('nav.back')" @click="$router.back()">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3 L5 8 L10 13"/></svg>
      </button>
      <span class="uw-wordmark">unwind</span>
      <button class="uw-menu-btn" :aria-label="$t('menu.label')" @click="$emit('open-menu')">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="5" x2="13" y2="5"/><line x1="3" y1="8" x2="13" y2="8"/><line x1="3" y1="11" x2="13" y2="11"/></svg>
      </button>
    </header>

    <!-- Empty state: prompt + starter chips -->
    <template v-if="messages.length === 0">
      <h1 class="uw-prompt uw-prompt--chat">{{ $t('chat.startersHint') }}</h1>
      <div class="uw-chat-starters">
        <button
          v-for="s in starters"
          :key="s"
          class="uw-chip uw-chip--tappable"
          @click="send(s)"
        >{{ s }}</button>
      </div>
    </template>

    <!-- Conversation -->
    <div v-else ref="scrollEl" class="uw-chat-scroll">
      <template v-for="(m, i) in messages" :key="i">
        <div v-if="m.role === 'user'" class="uw-bubble uw-bubble--user">{{ m.text }}</div>
        <div v-else class="uw-bubble uw-bubble--assistant">
          <p v-if="m.text">{{ m.text }}</p>
          <div v-if="m.activity" class="uw-activity-card">
            <div class="uw-activity-card__title">{{ m.activity.title }}</div>
            <div class="uw-activity-card__meta">
              <span>{{ $t('activity.duration', { minutes: m.activity.duration_minutes }) }}</span>
              <span aria-hidden="true">·</span>
              <span>{{ $t(`categories.${m.activity.category}`) }}</span>
            </div>
            <button class="uw-activity-card__save" @click="$emit('save', m.activity)">
              {{ $t('chat.saveActivity') }}
            </button>
          </div>
        </div>
      </template>
      <div v-if="pending" class="uw-bubble uw-bubble--assistant uw-bubble--typing">
        <span/><span/><span/>
      </div>
    </div>

    <!-- Composer -->
    <form class="uw-composer" @submit.prevent="send()">
      <input
        v-model="draft"
        class="uw-composer__input"
        :placeholder="$t('chat.placeholder')"
        :disabled="pending"
        autocomplete="off"
      />
      <button class="uw-composer__send" :disabled="!draft.trim() || pending" :aria-label="$t('chat.send')">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8 h 10 M 9 4 l 4 4 -4 4"/></svg>
      </button>
    </form>

    <nav class="uw-nav" :aria-label="$t('nav.label')">
      <router-link to="/" class="uw-nav__item">{{ $t('nav.suggest') }}</router-link>
      <router-link to="/chat" class="uw-nav__item uw-nav__item--active">{{ $t('nav.chat') }}</router-link>
    </nav>
  </main>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../api/client.js'
import { useTheme } from '../composables/useTheme.js'

defineEmits(['open-menu', 'save'])
const { t } = useI18n()
const { colorScheme: theme } = useTheme()

type Msg = { role: 'user' | 'assistant'; text?: string; activity?: any }

const draft = ref('')
const pending = ref(false)
const messages = ref<Msg[]>([])
const scrollEl = ref<HTMLElement | null>(null)

const starters = [
  t('chat.starterNoBrain'),
  t('chat.starterShortBreak'),
  t('chat.starterOutside'),
]

async function send(prefill?: string) {
  const text = (prefill ?? draft.value).trim()
  if (!text) return
  messages.value.push({ role: 'user', text })
  draft.value = ''
  pending.value = true
  await nextTick()
  scrollEl.value?.scrollTo({ top: scrollEl.value.scrollHeight })
  try {
    const res = await api<{ reply: string; activity?: any }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message: text }),
    })
    messages.value.push({ role: 'assistant', text: res.reply, activity: res.activity })
  } catch {
    messages.value.push({ role: 'assistant', text: t('chat.error') })
  } finally {
    pending.value = false
    await nextTick()
    scrollEl.value?.scrollTo({ top: scrollEl.value.scrollHeight, behavior: 'smooth' })
  }
}
</script>

<style scoped>
.uw-back {
  width: 34px; height: 34px; border-radius: 17px; border: 0; padding: 0;
  background: var(--uw-menu-bg); color: var(--uw-ink); cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
}

.uw-prompt--chat { padding-top: 56px; font-size: 22px; color: var(--uw-ink); max-width: 260px; }

.uw-chat-starters {
  position: absolute; left: 22px; right: 22px; bottom: 130px;
  display: flex; flex-direction: column; gap: 8px; align-items: flex-start;
}
.uw-chip--tappable {
  border: 1px solid var(--uw-border-soft);
  background: transparent; cursor: pointer;
  padding: 10px 14px; font-size: 13.5px;
  transition: background 120ms ease;
}
.uw-chip--tappable:hover { background: var(--uw-chip-bg); }

.uw-chat-scroll {
  position: absolute; left: 0; right: 0; top: 72px; bottom: 118px;
  overflow-y: auto;
  padding: 12px 18px 20px;
  display: flex; flex-direction: column; gap: 10px;
}

.uw-bubble {
  max-width: 78%; padding: 11px 14px;
  font-size: 14.5px; line-height: 1.45;
  border-radius: 18px;
}
.uw-bubble--user {
  align-self: flex-end;
  background: var(--uw-primary); color: var(--uw-primary-fg);
  border-bottom-right-radius: 6px;
}
.uw-bubble--assistant {
  align-self: flex-start;
  background: var(--uw-chip-bg); color: var(--uw-ink);
  border-bottom-left-radius: 6px;
}
.uw-bubble--typing { display: inline-flex; gap: 4px; padding: 14px 16px; }
.uw-bubble--typing span {
  width: 6px; height: 6px; border-radius: 3px; background: var(--uw-ink-mute);
  animation: uw-blink 1.2s infinite ease-in-out;
}
.uw-bubble--typing span:nth-child(2) { animation-delay: 0.15s; }
.uw-bubble--typing span:nth-child(3) { animation-delay: 0.3s; }
@keyframes uw-blink { 0%, 80%, 100% { opacity: 0.2; } 40% { opacity: 1; } }

.uw-activity-card {
  margin-top: 10px;
  padding: 12px 14px;
  background: var(--uw-screen-bg, rgba(255,255,255,0.35));
  border: 1px solid var(--uw-border-soft);
  border-radius: 14px;
  display: flex; flex-direction: column; gap: 6px;
}
.uw-activity-card__title {
  font-family: var(--uw-font-serif); font-size: 17px; font-weight: 400;
  color: var(--uw-ink); letter-spacing: -0.2px;
}
.uw-activity-card__meta {
  display: flex; gap: 8px; font-size: 12.5px; color: var(--uw-ink-mute);
}
.uw-activity-card__save {
  align-self: flex-start; margin-top: 6px;
  border: 0; background: transparent; padding: 0;
  color: var(--uw-primary); font-size: 13px; font-weight: 500;
  cursor: pointer;
}

.uw-composer {
  position: absolute; left: 14px; right: 14px; bottom: 64px;
  display: flex; align-items: center; gap: 8px;
  padding: 6px 6px 6px 16px;
  border-radius: 999px;
  background: var(--uw-chip-bg);
  border: 1px solid var(--uw-border-soft);
}
.uw-composer__input {
  flex: 1; border: 0; background: transparent; outline: none;
  font-family: var(--uw-font-sans); font-size: 14.5px; color: var(--uw-ink);
}
.uw-composer__input::placeholder { color: var(--uw-ink-mute); }
.uw-composer__send {
  width: 36px; height: 36px; border-radius: 18px; border: 0;
  background: var(--uw-primary); color: var(--uw-primary-fg);
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.uw-composer__send:disabled { opacity: 0.4; cursor: default; }

.uw-nav__item { text-decoration: none; }
</style>
