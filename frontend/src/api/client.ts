import * as Sentry from '@sentry/vue'
import router from '../router/index.js'
import { setOnline } from '../composables/useOnline.js'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API error ${status}`)
  }
}

// The request never got an HTTP response: offline, DNS failure, dropped
// connection, CORS block. Distinct from ApiError ("the server answered, and said
// no") because callers react differently: a network failure is worth retrying
// later, a 4xx is not.
export class NetworkError extends Error {
  constructor(public cause: unknown) {
    super('Network unavailable')
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    const headers: Record<string, string> = { ...(options.headers as Record<string, string>) }
    if (options.body != null && headers['Content-Type'] == null) {
      headers['Content-Type'] = 'application/json'
    }

    // Only this call is wrapped: fetch() rejects (with a TypeError) exactly when
    // no response came back, so a TypeError from our own code further down is
    // never mistaken for "offline".
    let response: Response
    try {
      response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        credentials: 'include',
        headers,
      })
    } catch (fetchError) {
      setOnline(false)
      throw new NetworkError(fetchError)
    }
    // Any response, even a 4xx/5xx, proves the server is reachable.
    setOnline(true)

    if (response.status === 401) {
      if (localStorage.getItem('unwind-user')) {
        localStorage.removeItem('unwind-user')
        router.push({ name: 'login' })
      }
      throw new ApiError(401, null)
    }

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      throw new ApiError(response.status, body)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return await response.json() as T
  } catch (err) {
    // Expected, user-facing states are not bugs, so don't report them:
    // - 401 (session expired -> redirect to login) and 429 (rate limit reached)
    // - a network failure while the device itself says it is offline (airplane
    //   mode, tunnel). A network failure while the device thinks it IS online
    //   (CORS, DNS, server down) stays reported: that's what #57 is about.
    const isExpected =
      (err instanceof ApiError && (err.status === 401 || err.status === 429)) ||
      (err instanceof NetworkError && !navigator.onLine)
    if (!isExpected) {
      Sentry.captureException(err, {
        tags: {
          endpoint: path,
          method: options.method ?? 'GET',
          kind: err instanceof NetworkError ? 'network' : 'api',
        },
      })
    }
    throw err
  }
}
