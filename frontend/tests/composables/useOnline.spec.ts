import { describe, it, expect } from 'vitest'
import { useOnline } from '../../src/composables/useOnline'

describe('useOnline', () => {
  it('should turn offline when the browser loses its connection', () => {
    // Arrange
    const { isOnline } = useOnline()

    // Act
    window.dispatchEvent(new Event('offline'))

    // Assert
    expect(isOnline.value).toBe(false)
  })

  it('should turn online again when the browser regains its connection', () => {
    // Arrange
    const { isOnline } = useOnline()
    window.dispatchEvent(new Event('offline'))

    // Act
    window.dispatchEvent(new Event('online'))

    // Assert
    expect(isOnline.value).toBe(true)
  })
})
