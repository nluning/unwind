import { onBeforeUnmount, onMounted, watch } from 'vue'
import { api, ApiError, NetworkError } from '../api/client.js'
import { enqueue, listOutbox, removeFromOutbox } from '../utils/localDb.js'
import { useAuth } from './useAuth.js'

// The outbox is an at-least-once queue: an entry is only removed once the server
// has answered it. Delivery is effectively-once because the server inserts
// usage events idempotently on the client-minted id (plan 29, chunk 1).

let flushing = false
let flushRequestedWhileRunning = false

// Network trouble, an expired session and rate limiting all heal on their own, so
// the entry stays and the queue pauses. Any other 4xx is a request the server
// will never accept; retrying it forever would block everything behind it.
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

// Mount once at app level. Triggers: a session becoming available (app start),
// the connection coming back, and the app returning to the foreground. There is
// no Background Sync API on iOS, so nothing is delivered while the app is closed.
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
