import { ref, computed } from 'vue'
import { api } from '../api/client.js'
import type { Activity, CreateActivityPayload, UpdateActivityPayload } from '../types/activity.js'
import { CATEGORY_ID_MAP } from '../types/activity.js'
import { pickWeighted } from './suggestionWeighting.js'
import { useAuth } from './useAuth.js'
import { loadActivities, saveActivities } from '../utils/localDb.js'

export type { Activity, CreateActivityPayload, UpdateActivityPayload }
// Re-exported so existing page imports (ActivityFormPage, CounterbalancePage)
// keep working; the canonical home is types/activity.ts.
export { CATEGORY_ID_MAP }

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

  // Stale-while-revalidate: show the last snapshot from IndexedDB at once, then
  // replace it with what the server says. The request starts first so reading
  // the snapshot never delays it.
  async function fetchActivities() {
    error.value = false
    const ownerId = useAuth().user.value?.id

    const network = api<Activity[]>('/activities').then(
      (fresh) => ({ ok: true as const, fresh }),
      () => ({ ok: false as const }),
    )

    if (ownerId && !loaded.value) {
      const snapshot = await loadActivities(ownerId).catch(() => null)
      // The server may have answered while we were reading; never overwrite
      // fresher data with the snapshot.
      if (snapshot && !loaded.value) {
        activities.value = snapshot
        loaded.value = true
      }
    }

    const result = await network
    if (result.ok) {
      activities.value = result.fresh
      loaded.value = true
      // Best-effort: a full or blocked store must not break the app.
      if (ownerId) saveActivities(ownerId, result.fresh).catch(() => {})
    } else if (!loaded.value) {
      // A failed refresh only counts as an error when there is nothing to show.
      error.value = true
    }
  }

  // `source` lets filters compose by chaining their results.
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
      // Uncategorized activities have nothing to match against, so they'd
      // always fail `.some(...)` and vanish from every category filter.
      // Treat "no category" as "not excluded by this filter" instead.
      (activity) => activity.categories.length === 0 || activity.categories.some((cat) => includedCategories.includes(cat))
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
