import { ref } from 'vue'
import { api, ApiError } from '../api/client.js'
import { useActivities } from './useActivities.js'
import type { Activity } from '../types/activity.js'
import { toCreatePayload, type AiActivity } from '../utils/parseActivity.js'

export function useSuggestFromList() {
  const { createActivity } = useActivities()

  const suggestions = ref<AiActivity[]>([])
  const loading = ref(false)
  const failed = ref(false)
  const rateLimitMessage = ref<string | null>(null)

  // `seedActivityId` anchors the batch to one activity ("Meer van dit"); omit it
  // for the generic whole-library suggestion flow.
  async function generate(seedActivityId?: string) {
    loading.value = true
    failed.value = false
    rateLimitMessage.value = null
    suggestions.value = []
    try {
      const result = await api<{ activities: AiActivity[] }>('/activities/suggest-from-list', {
        method: 'POST',
        ...(seedActivityId
          ? {
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ seed_activity_id: seedActivityId }),
            }
          : {}),
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

  async function save(activity: AiActivity): Promise<Activity> {
    return createActivity(toCreatePayload(activity))
  }

  return { suggestions, loading, failed, rateLimitMessage, generate, save }
}
