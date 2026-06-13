import { ref } from 'vue'
import { api, ApiError } from '../api/client.js'
import { useActivities } from './useActivities.js'
import { toCreatePayload, type AiActivity } from '../utils/parseActivity.js'

export type QuickAnswers = {
  location?: 'indoor' | 'outdoor'
  social?: 'alone' | 'with_others'
  energy?: 'calm' | 'active'
}

export function useSuggestFromAnswers() {
  const { createActivity } = useActivities()

  const suggestion = ref<AiActivity | null>(null)
  const loading = ref(false)
  const failed = ref(false)
  // Server-provided message when the daily limit is hit (already localized
  // Dutch); null for other failures, which fall back to the generic StateError.
  const rateLimitMessage = ref<string | null>(null)

  // `exclude` carries titles already shown this session so "Andere suggestie"
  // actually varies — same answers + history otherwise converge on one activity.
  async function generate(answers: QuickAnswers, exclude: string[] = []) {
    loading.value = true
    failed.value = false
    rateLimitMessage.value = null
    suggestion.value = null
    try {
      const result = await api<{ activity: AiActivity }>('/activities/suggest-from-answers', {
        method: 'POST',
        body: JSON.stringify(exclude.length > 0 ? { ...answers, exclude } : answers),
      })
      suggestion.value = result.activity
    } catch (error) {
      failed.value = true
      if (error instanceof ApiError && error.status === 429) {
        rateLimitMessage.value = (error.body as { error?: string })?.error ?? null
      }
    } finally {
      loading.value = false
    }
  }

  async function save(activity: AiActivity) {
    await createActivity(toCreatePayload(activity))
  }

  return { suggestion, loading, failed, rateLimitMessage, generate, save }
}
