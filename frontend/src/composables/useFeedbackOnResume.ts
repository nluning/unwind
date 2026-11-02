import { onMounted, onBeforeUnmount, watch } from 'vue'
import { usePostActivityFeedback } from './usePostActivityFeedback.js'

// Asks the server whether an accepted activity is waiting for an answer whenever
// the app comes back to the foreground. Mount it once, at app level — not in a
// page — so it also covers a cold start and a resume on any page.
//
// The OS may keep the PWA alive or evict it, and browsers disagree on which
// event fires on resume (iOS standalone PWAs in particular), so all three are
// listened to; `checkPending` debounces them into a single request.
export function useFeedbackOnResume(isEligible: () => boolean) {
  const { checkPending } = usePostActivityFeedback()

  function check() {
    if (document.visibilityState === 'visible' && isEligible()) checkPending()
  }

  // Also check when the user becomes eligible (session ready, left a public
  // page): that is the cold-start check.
  watch(isEligible, (eligible) => {
    if (eligible) check()
  }, { immediate: true })

  onMounted(() => {
    document.addEventListener('visibilitychange', check)
    window.addEventListener('pageshow', check)
    window.addEventListener('focus', check)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', check)
    window.removeEventListener('pageshow', check)
    window.removeEventListener('focus', check)
  })
}
