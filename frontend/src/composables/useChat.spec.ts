import { describe, it, expect, vi } from 'vitest'
import type { Activity } from '../types/activity.js'
import { useChat, setChatSeed, takeChatSeed } from './useChat.js'

const seedActivity: Activity = {
  id: 'a1',
  title: 'Maak een kruiswoordpuzzel',
  description: null,
  suggested_duration: 15,
  min_stress_level: 1,
  max_stress_level: 5,
  source: 'base',
  times_accepted: 0,
  times_skipped: 0,
  categories: ['Head'],
}

// A fetch whose body immediately reports "done" — enough to drive sendMessage
// to completion without streaming any tokens.
function stubFetchOnce() {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    body: { getReader: () => ({ read: () => Promise.resolve({ done: true, value: undefined }) }) },
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function bodyOf(fetchMock: ReturnType<typeof stubFetchOnce>) {
  return JSON.parse(fetchMock.mock.calls[0]![1]!.body as string)
}

describe('useChat', () => {
  it('should send the activity as hidden context when the chat was opened from a suggestion', async () => {
    // Arrange
    const fetchMock = stubFetchOnce()
    const { sendMessage } = useChat()

    // Act
    await sendMessage('Welk boek raad je aan?', undefined, { title: 'Lees een boek', description: 'Fictie' })

    // Assert
    expect(bodyOf(fetchMock).activity_context).toEqual({ title: 'Lees een boek', description: 'Fictie' })
  })

  it('should omit activity context for a normal chat message', async () => {
    // Arrange
    const fetchMock = stubFetchOnce()
    const { sendMessage } = useChat()

    // Act
    await sendMessage('Ik ben gestrest')

    // Assert
    expect(bodyOf(fetchMock).activity_context).toBeUndefined()
  })

  it('should carry a seeded activity across navigation and clear it once consumed', () => {
    // Arrange
    setChatSeed(seedActivity)

    // Act
    const first = takeChatSeed()
    const second = takeChatSeed()

    // Assert
    expect(first).toEqual(seedActivity)
    expect(second).toBeNull()
  })
})
