import { ref } from 'vue'
import type { Activity } from '../types/activity.js'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatActivityContext {
  title: string
  description?: string
}

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// Module-scoped so it survives the navigation from the Verras-me page
// ("Chat hierover") to the chat page, mirroring useSuggestionFlow's module
// state. ChatPage reads and clears it on mount so a later plain visit to /chat
// doesn't resurface a stale activity. Holds the full activity so the chat page
// can render its card.
const chatSeedActivity = ref<Activity | null>(null)

export function setChatSeed(activity: Activity | null) {
  chatSeedActivity.value = activity
}

export function takeChatSeed(): Activity | null {
  const seed = chatSeedActivity.value
  chatSeedActivity.value = null
  return seed
}

export function useChat() {
  const messages = ref<ChatMessage[]>([])
  const isStreaming = ref(false)
  const error = ref<string | null>(null)

  async function sendMessage(text: string, stressLevel?: number, activityContext?: ChatActivityContext) {
    error.value = null

    // Add the user's message to the conversation
    messages.value = [...messages.value, { role: 'user', content: text }]

    // Prepare an empty assistant message that we'll fill token by token
    messages.value = [...messages.value, { role: 'assistant', content: '' }]
    const assistantIndex = messages.value.length - 1

    isStreaming.value = true

    try {
      const response = await fetch(`${BASE_URL}/chat/stream`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.value.slice(0, -1).map(({ role, content }) => ({ role, content })),
          stress_level: stressLevel,
          // Hidden context: the activity the user opened this chat about. Sent
          // alongside every message so the assistant keeps it in mind.
          ...(activityContext ? { activity_context: activityContext } : {}),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Decode the raw bytes into text and add to our buffer
        buffer += decoder.decode(value, { stream: true })

        // Split on double-newline (SSE event boundary)
        const events = buffer.split('\n\n')
        // The last element is either empty or an incomplete event — keep it in the buffer
        buffer = events.pop()!

        for (const event of events) {
          const line = event.trim()
          if (!line.startsWith('data: ')) continue

          const data = JSON.parse(line.slice(6))

          if (data.type === 'text') {
            // Append this chunk to the assistant's message
            const updated = [...messages.value]
            updated[assistantIndex] = {
              ...updated[assistantIndex]!,
              content: updated[assistantIndex]!.content + data.text,
            }
            messages.value = updated
          }

          if (data.type === 'error') {
            error.value = data.error
          }
        }
      }
    } catch {
      error.value = 'Er ging iets mis. Probeer het opnieuw.'
    } finally {
      isStreaming.value = false
    }
  }

  function resetChat() {
    messages.value = []
    error.value = null
    isStreaming.value = false
  }

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    resetChat,
  }
}
