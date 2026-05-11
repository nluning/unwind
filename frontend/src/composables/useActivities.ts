import { ref, computed } from 'vue'
import { api } from '../api/client.js'
import type { Activity, CreateActivityPayload, UpdateActivityPayload } from '../types/activity.js'

export type { Activity, CreateActivityPayload, UpdateActivityPayload }

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

const activities = ref<Activity[]>([])
const loaded = ref(false)
const error = ref(false)

export function resetActivitiesState() {
  activities.value = []
  loaded.value = false
  error.value = false
}

export function useActivities() {
  const sessionSuggested = ref<Set<string>>(new Set())
  const sessionAccepted = ref<Set<string>>(new Set())

  async function fetchActivities() {
    error.value = false
    try {
      activities.value = await api<Activity[]>('/activities')
      loaded.value = true
    } catch {
      error.value = true
    }
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
      categories: payload.category_ids.map((categoryId) => CATEGORY_NAME_MAP[categoryId] ?? `Unknown(${categoryId})`),
      times_skipped: 0,
    }

    activities.value = [...activities.value, enriched]
    return enriched
  }

  async function updateActivity(activityId: string, payload: UpdateActivityPayload): Promise<Activity> {
    const raw = await api<Activity>(`/activities/${activityId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    // PUT returns the raw row without joined categories. If the caller sent
    // new category_ids, reconstruct the names; otherwise keep whatever we had.
    const previous = activities.value.find((existing) => existing.id === activityId)
    const categories = payload.category_ids
      ? payload.category_ids.map((categoryId) => CATEGORY_NAME_MAP[categoryId] ?? `Unknown(${categoryId})`)
      : previous?.categories ?? []

    const updated: Activity = { ...raw, categories }

    activities.value = activities.value.map((existing) =>
      existing.id === activityId ? updated : existing
    )
    return updated
  }

  async function deleteActivity(activityId: string): Promise<void> {
    await api<{ ok: true }>(`/activities/${activityId}`, { method: 'DELETE' })
    // Backend handled hide-vs-delete; locally both mean "remove from list."
    activities.value = activities.value.filter((existing) => existing.id !== activityId)
  }

  const isEmpty = computed(() => loaded.value && activities.value.length === 0)

  return {
    activities,
    loaded,
    error,
    isEmpty,
    fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    filterByStress,
    filterByExcludedCategories,
    suggest,
    markAccepted,
    resetSession,
  }
}
