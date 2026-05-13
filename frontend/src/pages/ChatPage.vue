<template>
  <PageShell>
      <PageHeader
        back
        @back="$router.back()"
      />

      <button
        v-if="messages.length > 0"
        type="button"
        class="uw-menu-btn fixed top-[18px] right-[68px] z-20"
        :aria-label="$t('chat.newChat')"
        @click="handleReset"
      >
        <PlusIcon />
      </button>

      <h1
        v-if="messages.length === 0"
        class="uw-title pt-[80px] max-w-[260px]"
      >
        {{ $t('chat.startersHint') }}
      </h1>

      <div
        v-else
        ref="messageContainer"
        class="flex-1 overflow-y-auto px-[18px] pt-4 pb-3 flex flex-col gap-2.5"
      >
        <template v-for="(parsed, index) in parsedMessages" :key="index">
          <div
            v-if="parsed.role === 'user'"
            class="self-end max-w-[78%] rounded-[18px] rounded-br-[6px] px-3.5 py-2.5 bg-uw-primary text-uw-primary-fg text-sm leading-snug whitespace-pre-wrap"
          >
            {{ parsed.content }}
          </div>

          <div
            v-else
            class="self-start max-w-[78%] rounded-[18px] rounded-bl-[6px] bg-uw-chip text-uw-ink text-sm leading-snug"
          >
            <div
              v-if="parsed.textBefore"
              class="px-3.5 py-2.5 chat-markdown"
              v-html="renderMarkdown(parsed.textBefore)"
            />

            <div
              v-if="parsed.activity && !isStreaming"
              class="mx-3 my-2 p-3 rounded-xl border border-uw-border-soft flex flex-col gap-1.5"
              :style="{ background: 'rgba(255,255,255,0.35)' }"
            >
              <p class="font-serif text-base text-uw-ink leading-tight">
                {{ parsed.activity.title }}
              </p>
              <div class="flex gap-2 text-xs text-uw-ink-mute">
                <span>{{ $t('activity.duration', { minutes: parsed.activity.duration_minutes }) }}</span>
                <span aria-hidden="true">·</span>
                <span>{{ $t(`categories.${parsed.activity.category}`, parsed.activity.category) }}</span>
              </div>
              <button
                v-if="!savedIndices.has(index)"
                class="self-start mt-1 text-xs font-medium text-uw-primary cursor-pointer bg-transparent border-0 p-0 hover:opacity-80 disabled:opacity-40"
                :disabled="saving === index"
                @click="handleSave(index, parsed.activity)"
              >
                {{ saving === index ? '...' : $t('chat.save') }}
              </button>
              <p v-else class="text-xs text-uw-primary mt-1">
                {{ $t('chat.saved') }}
              </p>
            </div>

            <div
              v-if="parsed.textAfter"
              class="px-3.5 py-2.5 chat-markdown"
              v-html="renderMarkdown(parsed.textAfter)"
            />

            <div
              v-if="!parsed.textBefore && !parsed.activity"
              class="px-3.5 py-3 uw-chat-typing"
            >
              <span /><span /><span />
            </div>
          </div>
        </template>
      </div>

      <div
        v-if="messages.length === 0"
        class="mt-auto mb-3 px-[22px] flex flex-col gap-2 items-start"
      >
        <button
          v-for="starter in starters"
          :key="starter"
          class="rounded-full border border-uw-border-soft bg-transparent text-uw-ink text-sm font-medium px-3.5 py-2.5 cursor-pointer transition-colors hover:bg-uw-chip"
          @click="handleStarter(starter)"
        >
          {{ starter }}
        </button>
      </div>

      <p
        v-if="error"
        class="text-center text-sm text-uw-ink-mute px-6 py-2"
      >
        {{ error }}
      </p>

      <form
        class="mx-[14px] flex items-center gap-2 py-1.5 pl-4 pr-1.5 rounded-full bg-uw-chip border border-uw-border-soft"
        @submit.prevent="handleSend"
      >
        <input
          ref="inputElement"
          v-model="inputText"
          :placeholder="$t('chat.placeholder')"
          :disabled="isStreaming"
          class="flex-1 bg-transparent border-0 outline-none text-sm text-uw-ink placeholder:text-uw-ink-mute"
          autocomplete="off"
        />
        <button
          type="submit"
          :disabled="!inputText.trim() || isStreaming"
          class="w-9 h-9 rounded-full bg-uw-primary text-uw-primary-fg inline-flex items-center justify-center border-0 cursor-pointer disabled:opacity-40"
          :aria-label="$t('chat.send')"
        >
          <ForwardIcon />
        </button>
      </form>
  </PageShell>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChat } from '../composables/useChat.js'
import { useActivities } from '../composables/useActivities.js'
import { parseMessage, toCreatePayload, type AiActivity } from '../utils/parseActivity.js'
import { renderMarkdown } from '../utils/renderMarkdown.js'
import PageShell from '../components/PageShell.vue'
import PageHeader from '../components/PageHeader.vue'
import ForwardIcon from '../components/icons/ForwardIcon.vue'
import PlusIcon from '../components/icons/PlusIcon.vue'

const { t } = useI18n()
const { messages, isStreaming, error, sendMessage, resetChat } = useChat()
const { createActivity } = useActivities()

const starters = computed(() => [
  t('chat.starter1'),
  t('chat.starter2'),
  t('chat.starter3'),
  t('chat.starter4'),
])

const inputText = ref('')
const messageContainer = ref<HTMLElement | null>(null)
const inputElement = ref<HTMLInputElement | null>(null)
const savedIndices = ref<Set<number>>(new Set())
const saving = ref<number | null>(null)

const parsedMessages = computed(() =>
  messages.value.map((message) => {
    if (message.role === 'assistant') {
      const { textBefore, textAfter, activity } = parseMessage(message.content)
      return { ...message, textBefore, textAfter, activity }
    }
    return { ...message, textBefore: message.content, textAfter: '', activity: null }
  })
)

function handleStarter(text: string) {
  sendMessage(text)
}

function handleSend() {
  const text = inputText.value.trim()
  if (!text || isStreaming.value) return
  inputText.value = ''
  sendMessage(text)
}

function handleReset() {
  resetChat()
  savedIndices.value = new Set()
  saving.value = null
}

async function handleSave(index: number, activity: AiActivity) {
  saving.value = index
  try {
    const payload = toCreatePayload(activity)
    await createActivity(payload)
    savedIndices.value = new Set([...savedIndices.value, index])
  } catch {
    // Save failed — leave button visible so user can retry.
  } finally {
    saving.value = null
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  })
}

watch(messages, scrollToBottom, { deep: true })

watch(isStreaming, (streaming) => {
  if (!streaming) {
    nextTick(() => inputElement.value?.focus())
  }
})
</script>

<style scoped>
/* Typing indicator — custom keyframe; no utility equivalent. */
.uw-chat-typing {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}
.uw-chat-typing span {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: var(--uw-ink-mute);
  animation: uw-blink 1.2s infinite ease-in-out;
}
.uw-chat-typing span:nth-child(2) { animation-delay: 0.15s; }
.uw-chat-typing span:nth-child(3) { animation-delay: 0.3s; }
@keyframes uw-blink {
  0%, 80%, 100% { opacity: 0.2; }
  40% { opacity: 1; }
}

/* Markdown rendered via v-html — scoped :deep() reaches into generated elements. */
.chat-markdown :deep(p) { margin: 0; }
.chat-markdown :deep(p + p) { margin-top: 0.5rem; }
.chat-markdown :deep(strong) { font-weight: 600; }
.chat-markdown :deep(ul),
.chat-markdown :deep(ol) {
  margin: 0.5rem 0;
  padding-left: 1.25rem;
}
.chat-markdown :deep(li) { margin: 0.25rem 0; }
.chat-markdown :deep(code) {
  font-size: 0.85em;
  background: rgba(0, 0, 0, 0.08);
  padding: 0.1em 0.3em;
  border-radius: 0.25rem;
}
</style>
