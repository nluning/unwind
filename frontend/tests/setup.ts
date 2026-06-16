import { config } from '@vue/test-utils'
import { vi } from 'vitest'

config.global.stubs = {
  RouterLink: true,
}

// Safety net so no test hits the real network. Only `api` is stubbed; ApiError
// stays a real class because several modules do `instanceof ApiError`.
vi.mock('../src/api/client', () => ({
  api: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      public body: unknown,
    ) {
      super(`API error ${status}`)
    }
  },
}))
