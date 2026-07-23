import { describe, it, expect } from 'vitest'
import { useWelcome } from '../../src/composables/useWelcome'

describe('useWelcome', () => {
  it('should mark the user as welcomed and persist it when dismissed', () => {
    // Arrange
    localStorage.clear()
    const { isWelcomed, showMenuHint, dismiss } = useWelcome()
    isWelcomed.value = false
    showMenuHint.value = false

    // Act
    dismiss()

    // Assert
    expect(isWelcomed.value).toBe(true)
    expect(showMenuHint.value).toBe(true)
    expect(localStorage.getItem('unwind-welcomed')).toBe('1')
  })

  it('should hide the menu hint once it is dismissed', () => {
    // Arrange
    const { showMenuHint, dismiss, dismissMenuHint } = useWelcome()
    dismiss()

    // Act
    dismissMenuHint()

    // Assert
    expect(showMenuHint.value).toBe(false)
  })
})
