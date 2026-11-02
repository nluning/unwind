import { computed, ref } from 'vue'
import { api } from '../api/client.js'
import type { Activity } from '../types/activity.js'

export interface OutcomeCounts {
  better: number
  same: number
  worse: number
}

export interface ActivityStats extends OutcomeCounts, Pick<Activity, 'id' | 'title' | 'source'> {}

export interface Stats {
  byActivity: ActivityStats[]
}

// "Better" answers minus "worse" ones. "Same" says nothing either way.
function score(activity: OutcomeCounts) {
  return activity.better - activity.worse
}

// The user's own post-activity answers, ranked into what works and what doesn't.
// Fetched fresh on every visit (it changes whenever a question is answered) and
// deliberately not kept at module level, so nothing lingers after logout.
export function useStats() {
  const stats = ref<Stats | null>(null)
  const error = ref(false)

  // Activities that left the user better off more often than worse, best first.
  const best = computed(() =>
    (stats.value?.byActivity ?? [])
      .filter((activity) => score(activity) > 0)
      .sort((first, second) => score(second) - score(first) || first.title.localeCompare(second.title)),
  )

  // Activities that left the user worse off more often than better, worst first.
  const worst = computed(() =>
    (stats.value?.byActivity ?? [])
      .filter((activity) => score(activity) < 0)
      .sort((first, second) => score(first) - score(second) || first.title.localeCompare(second.title)),
  )

  async function fetchStats() {
    error.value = false
    try {
      stats.value = await api<Stats>('/me/stats')
    } catch {
      error.value = true
    }
  }

  return { stats, error, best, worst, fetchStats }
}
