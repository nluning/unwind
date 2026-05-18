import { ref } from 'vue'
import { api } from '../api/client.js'

export interface Memory {
  id: string
  fact: string
  source: 'ai_learned' | 'user_added' | 'onboarding'
  created_at: string
  updated_at: string
}

const memories = ref<Memory[]>([])
const loaded = ref(false)
const error = ref(false)

export function resetMemoriesState() {
  memories.value = []
  loaded.value = false
  error.value = false
}

export function useMemories() {
  async function fetchMemories() {
    error.value = false
    try {
      memories.value = await api<Memory[]>('/memories')
      loaded.value = true
    } catch {
      error.value = true
    }
  }

  async function addMemory(fact: string): Promise<Memory> {
    const created = await api<Memory>('/memories', {
      method: 'POST',
      body: JSON.stringify({ fact, source: 'user_added' }),
    })
    memories.value = [...memories.value, created]
    return created
  }

  async function deleteMemory(memoryId: string): Promise<void> {
    await api<{ ok: true }>(`/memories/${memoryId}`, { method: 'DELETE' })
    memories.value = memories.value.filter((memory) => memory.id !== memoryId)
  }

  return {
    memories,
    loaded,
    error,
    fetchMemories,
    addMemory,
    deleteMemory,
  }
}
