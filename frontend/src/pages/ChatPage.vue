<template>
  <main class="flex flex-col mx-auto w-full max-w-xl" style="height: calc(100vh - 5rem)">
    <div class="px-4 pt-6 pb-2 flex items-center justify-between">
      <h1 class="text-lg font-600">{{ $t('chat.heading') }}</h1>
      <button
        v-if="messages.length > 0"
        class="text-xs text-muted cursor-pointer bg-transparent border border-outline rounded-full px-3 py-1 hover:text-dim hover:border-dim"
        @click="handleReset"
      >
        {{ $t('chat.newChat') }}
      </button>
    </div>

    <!-- Message list -->
    <div ref="messageContainer" class="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
      <div
        v-for="(parsed, index) in parsedMessages"
        :key="index"
        class="max-w-[80%] rounded-2xl text-sm leading-relaxed"
        :class="parsed.role === 'user'
          ? 'self-end bg-primary text-white rounded-br-sm px-4 py-3'
          : 'self-start bg-card rounded-bl-sm'"
      >
        <!-- User message -->
        <template v-if="parsed.role === 'user'">
          <span class="whitespace-pre-wrap">{{ parsed.content }}</span>
        </template>

        <!-- Assistant message -->
        <template v-else>
          <div class="px-4 py-3 whitespace-pre-wrap">
            <template v-if="parsed.text">{{ parsed.text }}</template>
            <template v-else-if="parsed.activity">
              <span class="font-600">{{ parsed.activity.title }}</span>
              <template v-if="parsed.activity.description"><br />{{ parsed.activity.description }}</template>
            </template>
            <span v-else-if="!parsed.content" class="text-muted italic">{{ $t('chat.loading') }}</span>
          </div>

          <!-- Parsed activity card + save button -->
          <div v-if="parsed.activity && !isStreaming" class="mx-3 mb-3 p-3 rounded-xl bg-primary-light border border-outline">
            <p class="font-600 text-sm">{{ parsed.activity.title }}</p>
            <p v-if="parsed.activity.description" class="text-dim text-xs mt-1 leading-relaxed">
              {{ parsed.activity.description }}
            </p>
            <div class="flex gap-2 mt-2 text-xs text-muted">
              <span>{{ parsed.activity.duration_minutes }} min</span>
              <span>·</span>
              <span>{{ parsed.activity.category }}</span>
            </div>
            <button
              v-if="!savedIndices.has(index)"
              class="w-full mt-3 py-2 rounded-lg text-xs cursor-pointer border border-primary text-primary bg-transparent hover:bg-card"
              :disabled="saving === index"
              @click="handleSave(index, parsed.activity)"
            >
              {{ saving === index ? '...' : $t('chat.save') }}
            </button>
            <p v-else class="mt-2 text-xs text-accepted text-center">
              {{ $t('chat.saved') }}
            </p>
          </div>
        </template>
      </div>
    </div>

    <!-- Error -->
    <p v-if="error" class="px-4 py-2 text-error text-sm text-center">
      {{ error }}
    </p>

    <!-- Input area -->
    <div class="px-4 py-3 border-t border-outline flex gap-2">
      <input
        ref="inputElement"
        v-model="inputText"
        :placeholder="$t('chat.placeholder')"
        :disabled="isStreaming"
        class="flex-1 px-4 py-2.5 rounded-full bg-card border border-outline text-sm outline-none disabled:opacity-40"
        style="color: var(--c-text)"
        @keydown.enter="handleSend"
      />
      <button
        :disabled="!inputText.trim() || isStreaming"
        class="px-5 py-2.5 rounded-full bg-primary text-white text-sm cursor-pointer border-none disabled:opacity-40"
        @click="handleSend"
      >
        {{ $t('chat.send') }}
      </button>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useChat } from '../composables/useChat.js'
import { useActivities } from '../composables/useActivities.js'
import { parseMessage, toCreatePayload, type AiActivity } from '../utils/parseActivity.js'

const { messages, isStreaming, error, sendMessage, resetChat } = useChat()
const { createActivity } = useActivities()

const inputText = ref('')
const messageContainer = ref<HTMLElement | null>(null)
const inputElement = ref<HTMLInputElement | null>(null)
const savedIndices = ref<Set<number>>(new Set())
const saving = ref<number | null>(null)

const parsedMessages = computed(() =>
  messages.value.map((message) => {
    if (message.role === 'assistant') {
      const { text, activity } = parseMessage(message.content)
      return { ...message, text, activity }
    }
    return { ...message, text: message.content, activity: null }
  })
)

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
    // If save fails, don't mark as saved — button stays visible to retry
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

// Auto-scroll when messages change (including during streaming)
watch(messages, scrollToBottom, { deep: true })

// Focus input after streaming completes
watch(isStreaming, (streaming) => {
  if (!streaming) {
    nextTick(() => inputElement.value?.focus())
  }
})
</script>
