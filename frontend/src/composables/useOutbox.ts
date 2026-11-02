import { onBeforeUnmount, onMounted, watch } from 'vue'
import { api, ApiError, NetworkError } from '../api/client.js'
import { enqueue, listOutbox, removeFromOutbox } from '../utils/localDb.js'
import { useAuth } from './useAuth.js'

// At-least-once: an entry is removed only once the server has answered. The
// idempotent insert on the client-minted id makes that effectively-once.

let flushing = false
let flushRequestedWhileRunning = false

// Network trouble, an expired session and rate limiting heal on their own: keep the
// entry and pause. Any other 4xx will never be accepted and would block the queue.
function shouldRetryLater(error: unknown): boolean {
  if (error instanceof NetworkError) return true
  if (error instanceof ApiError) {
    return error.status === 401 || error.status === 429 || error.status >= 500
  }
  return false
}

export async function flushOutbox(): Promise<void> {
  if (flushing) {
    flushRequestedWhileRunning = true
    return
  }
  flushing = true
  try {
    do {
      flushRequestedWhileRunning = false
      const ownerId = useAuth().user.value?.id
      if (!ownerId) return

      for (const entry of await listOutbox()) {
        // Never replay one user's events under another user's session.
        if (entry.ownerId !== ownerId) {
          await removeFromOutbox(entry.key)
          continue
        }
        try {
          await api(entry.path, { method: entry.method, body: entry.body ?? undefined })
        } catch (error) {
          if (shouldRetryLater(error)) return
        }
        await removeFromOutbox(entry.key)
      }
    } while (flushRequestedWhileRunning)
  } catch {
    // Storage trouble: the entries stay queued and the next trigger retries.
  } finally {
    flushing = false
  }
}

export async function queueRequest(method: string, path: string, payload: object): Promise<void> {
  const ownerId = useAuth().user.value?.id
  if (!ownerId) return

  const body = JSON.stringify(payload)
  try {
    await enqueue({ ownerId, method, path, body })
  } catch {
    // No usable storage (private mode): behave like before the outbox existed.
    api(path, { method, body }).catch(() => {})
    return
  }
  void flushOutbox()
}

// Mount once at app level. Flush triggers: session available, `online`, tab visible.
// No Background Sync on iOS, so nothing is delivered while the app is closed.
export function useOutboxSync() {
  const { user } = useAuth()

  function flushWhenVisible() {
    if (document.visibilityState === 'visible') void flushOutbox()
  }

  watch(
    () => user.value?.id,
    (userId) => {
      if (userId) void flushOutbox()
    },
    { immediate: true },
  )

  onMounted(() => {
    window.addEventListener('online', flushOutbox)
    document.addEventListener('visibilitychange', flushWhenVisible)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('online', flushOutbox)
    document.removeEventListener('visibilitychange', flushWhenVisible)
  })
}
