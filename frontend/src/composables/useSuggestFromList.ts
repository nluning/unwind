import { ref } from 'vue'
import { api, ApiError } from '../api/client.js'
import { useActivities } from './useActivities.js'
import { toCreatePayload, type AiActivity } from '../utils/parseActivity.js'

// Analyse-fit route (plan 21 Phase 4): asks the backend for 3 NEW activities
// riffed on the user's own list + picks, and saves the ones the user chooses.
// State is local to the composable instance — re-entering the page starts fresh
// (and never auto-spends a generation; the user taps to generate).
export function useSuggestFromList() {
  const { createActivity } = useActivities()

  const suggestions = ref<AiActivity[]>([])
  const loading = ref(false)
  const failed = ref(false)
  // Server-provided message when the daily limit is hit (already localized
  // Dutch); null for other failures, which fall back to the generic StateError.
  const rateLimitMessage = ref<string | null>(null)

  async function generate() {
    loading.value = true
    failed.value = false
    rateLimitMessage.value = null
    suggestions.value = []
    try {
      const result = await api<{ activities: AiActivity[] }>('/activities/suggest-from-list', {
        method: 'POST',
      })
      suggestions.value = result.activities
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

  return { suggestions, loading, failed, rateLimitMessage, generate, save }
}
