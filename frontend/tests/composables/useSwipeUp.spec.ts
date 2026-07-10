import { describe, it, expect, vi } from 'vitest'
import { useSwipeUp } from '../../src/composables/useSwipeUp'

function touchStart(clientX: number, clientY: number): TouchEvent {
  return { touches: [{ clientX, clientY }] } as unknown as TouchEvent
}

function touchEnd(clientX: number, clientY: number): TouchEvent {
  return { changedTouches: [{ clientX, clientY }] } as unknown as TouchEvent
}

describe('useSwipeUp', () => {
  it('should open the menu when the finger travels far enough upward', () => {
    // Arrange
    const onSwipeUp = vi.fn()
    const { onTouchStart, onTouchEnd } = useSwipeUp(onSwipeUp, { threshold: 50 })

    // Act
    onTouchStart(touchStart(100, 300))
    onTouchEnd(touchEnd(100, 200)) // 100px up

    // Assert
    expect(onSwipeUp).toHaveBeenCalledOnce()
  })

  it('should ignore an upward flick shorter than the threshold', () => {
    // Arrange
    const onSwipeUp = vi.fn()
    const { onTouchStart, onTouchEnd } = useSwipeUp(onSwipeUp, { threshold: 50 })

    // Act
    onTouchStart(touchStart(100, 300))
    onTouchEnd(touchEnd(100, 280)) // only 20px up

    // Assert
    expect(onSwipeUp).not.toHaveBeenCalled()
  })

  it('should ignore a downward swipe', () => {
    // Arrange
    const onSwipeUp = vi.fn()
    const { onTouchStart, onTouchEnd } = useSwipeUp(onSwipeUp, { threshold: 50 })

    // Act
    onTouchStart(touchStart(100, 200))
    onTouchEnd(touchEnd(100, 320)) // 120px down

    // Assert
    expect(onSwipeUp).not.toHaveBeenCalled()
  })

  it('should ignore a mostly-horizontal swipe', () => {
    // Arrange
    const onSwipeUp = vi.fn()
    const { onTouchStart, onTouchEnd } = useSwipeUp(onSwipeUp, { threshold: 50, maxHorizontal: 60 })

    // Act
    onTouchStart(touchStart(100, 300))
    onTouchEnd(touchEnd(220, 200)) // 100px up but 120px sideways

    // Assert
    expect(onSwipeUp).not.toHaveBeenCalled()
  })
})
