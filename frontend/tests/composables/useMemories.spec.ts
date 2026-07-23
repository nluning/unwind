import { describe, it, expect, vi } from 'vitest'
import { api } from '../../src/api/client'
import { useMemories, resetMemoriesState } from '../../src/composables/useMemories'

describe('useMemories', () => {
  it('should populate memories and mark them loaded on a successful fetch', async () => {
    // Arrange
    resetMemoriesState()
    vi.mocked(api).mockResolvedValueOnce([
      { id: '1', fact: 'Houdt van wandelen', source: 'onboarding', created_at: '', updated_at: '' },
    ])
    const { memories, loaded, fetchMemories } = useMemories()

    // Act
    await fetchMemories()

    // Assert
    expect(memories.value).toHaveLength(1)
    expect(loaded.value).toBe(true)
  })

  it('should flag an error when the fetch fails', async () => {
    // Arrange
    resetMemoriesState()
    vi.mocked(api).mockRejectedValueOnce(new Error('network down'))
    const { error, loaded, fetchMemories } = useMemories()

    // Act
    await fetchMemories()

    // Assert
    expect(error.value).toBe(true)
    expect(loaded.value).toBe(false)
  })

  it('should add a memory as user_added and append it to the list', async () => {
    // Arrange
    resetMemoriesState()
    const created = {
      id: '9',
      fact: 'Drinkt graag thee',
      source: 'user_added',
      created_at: '',
      updated_at: '',
    }
    vi.mocked(api).mockResolvedValueOnce(created)
    const { memories, addMemory } = useMemories()

    // Act
    const result = await addMemory('Drinkt graag thee')

    // Assert
    expect(api).toHaveBeenCalledWith('/memories', {
      method: 'POST',
      body: JSON.stringify({ fact: 'Drinkt graag thee', source: 'user_added' }),
    })
    expect(memories.value).toContainEqual(created)
    expect(result).toEqual(created)
  })

  it('should remove a memory from the list when deleted', async () => {
    // Arrange
    resetMemoriesState()
    vi.mocked(api).mockResolvedValueOnce([
      { id: '1', fact: 'A', source: 'onboarding', created_at: '', updated_at: '' },
      { id: '2', fact: 'B', source: 'onboarding', created_at: '', updated_at: '' },
    ])
    const { memories, fetchMemories, deleteMemory } = useMemories()
    await fetchMemories()
    vi.mocked(api).mockResolvedValueOnce({ ok: true })

    // Act
    await deleteMemory('1')

    // Assert
    expect(api).toHaveBeenCalledWith('/memories/1', { method: 'DELETE' })
    expect(memories.value.map((memory) => memory.id)).toEqual(['2'])
  })
})
