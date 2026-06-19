// @vitest-environment jsdom — useSuggestFromList transitively imports the router (via useActivities), which needs a DOM.
import { describe, it, expect, vi } from 'vitest'
import { api, ApiError } from '../api/client.js'
import { useSuggestFromList } from './useSuggestFromList.js'

// Keep the real ApiError so the composable's `instanceof` rate-limit check works.
vi.mock('../api/client.js', async () => {
  const actual = await vi.importActual<typeof import('../api/client.js')>('../api/client.js')
  return { ...actual, api: vi.fn() }
})

describe('useSuggestFromList', () => {
  it('should anchor the request to the seed activity when generating "meer van dit"', async () => {
    // Arrange
    vi.mocked(api).mockResolvedValueOnce({ activities: [] })
    const { generate } = useSuggestFromList()

    // Act
    await generate('seed-123')

    // Assert
    expect(vi.mocked(api)).toHaveBeenCalledWith('/activities/suggest-from-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seed_activity_id: 'seed-123' }),
    })
  })

  it('should send no body for the generic whole-library generation', async () => {
    // Arrange
    vi.mocked(api).mockResolvedValueOnce({ activities: [] })
    const { generate } = useSuggestFromList()

    // Act
    await generate()

    // Assert
    expect(vi.mocked(api)).toHaveBeenCalledWith('/activities/suggest-from-list', { method: 'POST' })
  })

  it('should surface the server message when the daily limit is hit', async () => {
    // Arrange
    vi.mocked(api).mockRejectedValueOnce(new ApiError(429, { error: 'Limiet bereikt' }))
    const { generate, failed, rateLimitMessage } = useSuggestFromList()

    // Act
    await generate('seed-123')

    // Assert
    expect(failed.value).toBe(true)
    expect(rateLimitMessage.value).toBe('Limiet bereikt')
  })
})
