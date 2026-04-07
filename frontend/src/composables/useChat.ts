import { ref } from 'vue'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export function useChat() {
  const messages = ref<ChatMessage[]>([])
  const isStreaming = ref(false)
  const error = ref<string | null>(null)

  async function sendMessage(text: string, stressLevel?: number) {
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
    } catch (err) {
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
