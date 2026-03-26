import { ref, type Ref, type ComputedRef, watch } from 'vue'
import { useActivities, type Activity } from './useActivities.js'
import { api } from '../api/client.js'

interface SuggestionFlowOptions {
  mode: 'mode1' | 'mode2' | 'mode3' | 'mode4'
  pool: ComputedRef<Activity[]>
  extraEventData?: () => Record<string, unknown>
}

export function useSuggestionFlow(options: SuggestionFlowOptions) {
  const { suggest, markAccepted } = useActivities()

  const current = ref<Activity | null>(null)
  const accepted = ref(false)

  // Auto-suggest when the pool changes (e.g. stress level or category selected)
  watch(options.pool, (newPool) => {
    if (newPool.length > 0) {
      accepted.value = false
      current.value = suggest(newPool)
    } else {
      current.value = null
    }
  })

  function next() {
    accepted.value = false
    current.value = suggest(options.pool.value)
  }

  function handleAccept() {
    if (!current.value) return

    markAccepted(current.value.id)
    logEvent(current.value.id, 'accepted')
    current.value = null
    accepted.value = true
  }

  function handleSkip() {
    if (!current.value) return

    logEvent(current.value.id, 'skipped')
    next()
  }

  function logEvent(activityId: string, action: 'accepted' | 'skipped') {
    const extra = options.extraEventData?.() ?? {}
    api('/usage-events', {
      method: 'POST',
      body: JSON.stringify({
        activity_id: activityId,
        action,
        mode: options.mode,
        ...extra,
      }),
    })
  }

  return {
    current: current as Ref<Activity | null>,
    accepted,
    next,
    handleAccept,
    handleSkip,
  }
}
