import { ref, computed } from 'vue'
import { api } from '../api/client.js'

export interface Activity {
  id: string
  title: string
  description: string | null
  suggested_duration: number
  min_stress_level: number
  max_stress_level: number
  source: 'base' | 'user' | 'ai'
  times_skipped: number
  categories: string[]
}

export interface CreateActivityPayload {
  title: string
  description: string | null
  suggested_duration: number
  min_stress_level: number
  max_stress_level: number
  category_ids: number[]
}

// Hardcoded to match seed.sql SERIAL IDs. If categories become user-configurable,
// replace with a GET /categories endpoint.
export const CATEGORY_ID_MAP: Record<string, number> = {
  Head: 1,
  Hands: 2,
  Heart: 3,
}

const CATEGORY_NAME_MAP: Record<number, string> = Object.fromEntries(
  Object.entries(CATEGORY_ID_MAP).map(([name, id]) => [id, name])
)

// Module-level state — shared across all components that call useActivities()
const activities = ref<Activity[]>([])
const loaded = ref(false)

export function useActivities() {
  const sessionSuggested = ref<Set<string>>(new Set())
  const sessionAccepted = ref<Set<string>>(new Set())

  async function fetchActivities() {
    activities.value = await api<Activity[]>('/activities')
    loaded.value = true
  }

  function filterByStress(stressLevel: number): Activity[] {
    return activities.value.filter(
      (activity) => activity.min_stress_level <= stressLevel && activity.max_stress_level >= stressLevel
    )
  }

  function filterByExcludedCategories(excludedCategories: string[]): Activity[] {
    return activities.value.filter(
      (activity) => !activity.categories.some((cat) => excludedCategories.includes(cat))
    )
  }

  function getWeight(activity: Activity, maxSkips: number): number {
    const baseWeight = maxSkips + 1
    const historyPenalty = activity.times_skipped
    const sessionPenalty = sessionSuggested.value.has(activity.id) ? 2 : 0

    return Math.max(1, baseWeight - historyPenalty - sessionPenalty)
  }

  function weightedPick(candidates: Activity[]): Activity {
    const maxSkips = Math.max(...candidates.map((activity) => activity.times_skipped), 0)
    const weights = candidates.map((activity) => getWeight(activity, maxSkips))
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)

    let roll = Math.random() * totalWeight
    for (let index = 0; index < candidates.length; index++) {
      roll -= weights[index]!
      if (roll <= 0) return candidates[index]!
    }
    return candidates[candidates.length - 1]!
  }

  function suggest(pool?: Activity[]): Activity | null {
    const source = pool ?? activities.value
    const available = source.filter((activity) => !sessionAccepted.value.has(activity.id))

    if (available.length === 0) return null

    const pick = weightedPick(available)
    sessionSuggested.value.add(pick.id)
    return pick
  }

  function markAccepted(activityId: string) {
    sessionAccepted.value.add(activityId)
  }

  function resetSession() {
    sessionSuggested.value = new Set()
    sessionAccepted.value = new Set()
  }

  async function createActivity(payload: CreateActivityPayload): Promise<Activity> {
    const raw = await api<Activity & { category_ids?: number[] }>('/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    // POST returns the raw row (no joined categories). Reconstruct category
    // names from the IDs we sent so local state matches GET /activities shape.
    const enriched: Activity = {
      ...raw,
      categories: payload.category_ids.map((id) => CATEGORY_NAME_MAP[id] ?? `Unknown(${id})`),
      times_skipped: 0,
    }

    activities.value = [...activities.value, enriched]
    return enriched
  }

  const isEmpty = computed(() => loaded.value && activities.value.length === 0)

  return {
    activities,
    loaded,
    isEmpty,
    fetchActivities,
    createActivity,
    filterByStress,
    filterByExcludedCategories,
    suggest,
    markAccepted,
    resetSession,
  }
}
