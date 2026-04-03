import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// Stub router-link globally — prevents "Failed to resolve component" warnings
config.global.stubs = {
  RouterLink: true,
}

// Mock the API client — almost every test needs this
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

// Mock the router — prevents real navigation side effects
vi.mock('../src/router/index', () => ({
  default: { push: vi.fn() },
}))
