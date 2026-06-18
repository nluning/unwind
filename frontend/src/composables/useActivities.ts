import { ref, computed } from 'vue'
import { api } from '../api/client.js'
import type { Activity, CreateActivityPayload, UpdateActivityPayload } from '../types/activity.js'
import { pickWeighted } from './suggestionWeighting.js'

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

  // `source` defaults to the full list but can be passed an already-filtered
  // array so filters compose (e.g. stress then category) without intersecting
  // by id.
  function filterByStress(stressLevel: number, source: Activity[] = activities.value): Activity[] {
    return source.filter(
      (activity) => activity.min_stress_level <= stressLevel && activity.max_stress_level >= stressLevel
    )
  }

  function filterByExcludedCategories(excludedCategories: string[], source: Activity[] = activities.value): Activity[] {
    return source.filter(
      (activity) => !activity.categories.some((cat) => excludedCategories.includes(cat))
    )
  }

  function filterByIncludedCategories(includedCategories: string[], source: Activity[] = activities.value): Activity[] {
    return source.filter(
      (activity) => activity.categories.some((cat) => includedCategories.includes(cat))
    )
  }

  function suggest(pool?: Activity[]): Activity | null {
    const source = pool ?? activities.value

    if (source.length === 0) return null

    // Accepted-this-session activities stay in the pool but are heavily
    // down-weighted (not excluded), so a small library can't be starved.
    const ownCount = source.filter((activity) => activity.source !== 'base').length

    const pick = pickWeighted(source, {
      ownCount,
      suggestedThisSession: sessionSuggested.value,
      acceptedThisSession: sessionAccepted.value,
    })
    if (!pick) return null

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
      times_accepted: 0,
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
    filterByIncludedCategories,
    suggest,
    markAccepted,
    resetSession,
  }
}
