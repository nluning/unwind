import { ref, type Ref, type ComputedRef, watch } from 'vue'
import { useActivities } from './useActivities.js'
import type { Activity } from '../types/activity.js'
import { api } from '../api/client.js'

interface SuggestionFlowOptions {
  mode: 'mode1' | 'mode2' | 'mode3' | 'mode4'
  pool: ComputedRef<Activity[]>
  extraEventData?: () => Record<string, unknown>
}

// Module-level per-mode flow state. Persists across navigation so returning
// to a mode restores the in-progress suggestion. Cleared on logout via
// `resetSuggestionFlowState()`.
type FlowState = {
  current: Ref<Activity | null>
  accepted: Ref<boolean>
}

const flowStateByMode = new Map<string, FlowState>()

function getFlowState(mode: string): FlowState {
  let state = flowStateByMode.get(mode)
  if (!state) {
    state = { current: ref<Activity | null>(null), accepted: ref(false) }
    flowStateByMode.set(mode, state)
  }
  return state
}

// Picker state for Stress and Counterbalance, lifted to module scope so it
// survives navigation together with the flow state. Without this, returning
// to those pages would reset the selector and hide the persisted suggestion.
export const stressLevelState = ref<number | null>(null)
export const excludedCategoriesState = ref<string[]>([])

// Suggest-hub (mode1) filters, module-scoped like the picker state above.
export const suggestFilterStressState = ref<number | null>(null)
export const suggestFilterCategoriesState = ref<string[]>([])

export function resetSuggestionFlowState() {
  for (const state of flowStateByMode.values()) {
    state.current.value = null
    state.accepted.value = false
  }
  stressLevelState.value = null
  excludedCategoriesState.value = []
  suggestFilterStressState.value = null
  suggestFilterCategoriesState.value = []
}

export function useSuggestionFlow(options: SuggestionFlowOptions) {
  const { suggest, markAccepted } = useActivities()
  const { current, accepted } = getFlowState(options.mode)

  // Tracks whether this composable instance has seen a non-empty pool yet, so
  // the first non-empty pool can clear any sticky confirmation from a previous
  // visit before deciding whether to restore or pick a suggestion.
  let sawNonEmptyPool = false

  watch(
    options.pool,
    (newPool) => {
      if (newPool.length === 0) return

      if (!sawNonEmptyPool) {
        sawNonEmptyPool = true
        // Clear any sticky "accepted" confirmation from a previous visit — the
        // user asked not to see it again on return.
        accepted.value = false
      } else if (accepted.value) {
        return
      }

      // Keep the current suggestion when it's still in the pool; only pick a
      // fresh one when it's gone (filtered out, deleted) or we don't have one
      // yet. This way merely *adding* an activity — which grows the pool — never
      // bumps the suggestion the user is looking at.
      const stillValid =
        current.value !== null &&
        newPool.some((activity) => activity.id === current.value!.id)
      if (!stillValid) {
        current.value = suggest(newPool)
      }
    },
    { immediate: true }
  )

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
