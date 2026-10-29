import { computed, ref, shallowRef } from 'vue'
import { api } from '../api/client.js'
import type { Activity } from '../types/activity.js'

export type FeedbackOutcome = 'better' | 'same' | 'worse'

export interface FeedbackTarget {
  eventId: string
  activity: Pick<Activity, 'id' | 'title' | 'source'>
}

interface PendingFeedbackResponse {
  pending: { id: string; activity: FeedbackTarget['activity'] } | null
}

// App-resume events (visibilitychange + pageshow + focus) often fire together;
// one check is enough.
const CHECK_DEBOUNCE_MS = 1000

// Module-level state, like useSuggestionFlow: the interstitial is mounted once
// in App.vue while the triggers ('klaar' button, app resume) live elsewhere.
// Cleared on logout via `resetPostActivityFeedback()`.

// The question currently shown to the user, or null when there is none.
const target = ref<FeedbackTarget | null>(null)

// The activity accepted most recently in this session. The event id arrives
// asynchronously (the accept POST is fire-and-forget), so it's kept as a promise
// that resolves to null when logging the event failed.
const lastAccepted = shallowRef<{
  activity: FeedbackTarget['activity']
  eventId: Promise<string | null>
} | null>(null)

// Counts answered questions (not skipped ones). A page still showing the 'tot zo'
// confirmation watches it to move on to the next suggestion.
const answeredCount = ref(0)

let lastCheckAt = 0

export function resetPostActivityFeedback() {
  target.value = null
  lastAccepted.value = null
  lastCheckAt = 0
}

export function usePostActivityFeedback() {
  // Whether the 'klaar' button has an accepted activity to ask about.
  const canFinish = computed(() => lastAccepted.value !== null)

  function trackAccepted(activity: FeedbackTarget['activity'], event: Promise<{ id: string }>) {
    lastAccepted.value = {
      activity,
      eventId: event.then((created) => created.id).catch(() => null),
    }
  }

  // The 'klaar' button: the user says they're done, so ask right away — no time
  // threshold, and no round trip to find out which event it is.
  async function openForLastAccepted() {
    const accepted = lastAccepted.value
    if (!accepted || target.value) return

    const eventId = await accepted.eventId
    if (eventId && !target.value) {
      target.value = { eventId, activity: accepted.activity }
    }
  }

  // App resume / cold start: ask the server whether an accepted activity is
  // waiting for an answer. The server decides if it's old enough to ask about.
  async function checkPending() {
    if (target.value || !navigator.onLine) return

    const now = Date.now()
    if (now - lastCheckAt < CHECK_DEBOUNCE_MS) return
    lastCheckAt = now

    try {
      const { pending } = await api<PendingFeedbackResponse>('/me/pending-feedback')
      if (pending && !target.value) {
        target.value = { eventId: pending.id, activity: pending.activity }
      }
    } catch {
      // Best-effort: failing to ask must never get in the user's way.
    }
  }

  // Answering and dismissing close the question straight away; the PATCH is
  // best-effort, like the other usage-event calls.
  function finish(body: { outcome: FeedbackOutcome } | { dismissed: true }) {
    const current = target.value
    if (!current) return

    target.value = null
    lastAccepted.value = null
    if ('outcome' in body) answeredCount.value++
    api(`/usage-events/${current.eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }).catch(() => {})
  }

  function answer(outcome: FeedbackOutcome) {
    finish({ outcome })
  }

  function dismiss() {
    finish({ dismissed: true })
  }

  return {
    target,
    canFinish,
    answered: computed(() => answeredCount.value),
    trackAccepted,
    openForLastAccepted,
    checkPending,
    answer,
    dismiss,
  }
}
