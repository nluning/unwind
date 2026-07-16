import { describe, it, expect, vi } from 'vitest'
import { useCardSwipe } from './useCardSwipe.js'

function touchStart(clientX: number, clientY: number): TouchEvent {
  return { touches: [{ clientX, clientY }] } as unknown as TouchEvent
}

function touchMove(clientX: number, clientY: number): TouchEvent {
  return {
    touches: [{ clientX, clientY }],
    cancelable: true,
    preventDefault: () => {},
  } as unknown as TouchEvent
}

function touchEnd(clientX: number, clientY: number): TouchEvent {
  return { changedTouches: [{ clientX, clientY }] } as unknown as TouchEvent
}

describe('useCardSwipe', () => {
  it('should complete an accept once the exit finishes, when dragged right past the commit threshold', () => {
    // Arrange
    const onAccept = vi.fn()
    const onSkip = vi.fn()
    const onOpenSheet = vi.fn()
    const { onTouchStart, onTouchMove, onTouchEnd, finishExit } = useCardSwipe({
      onAccept,
      onSkip,
      onOpenSheet,
      swipeThreshold: 100,
    })

    // Act
    onTouchStart(touchStart(100, 300))
    onTouchMove(touchMove(260, 300)) // 160px right
    onTouchEnd(touchEnd(260, 300))
    finishExit()

    // Assert
    expect(onAccept).toHaveBeenCalledOnce()
    expect(onSkip).not.toHaveBeenCalled()
    expect(onOpenSheet).not.toHaveBeenCalled()
  })

  it('should complete a skip once the exit finishes, when dragged left past the commit threshold', () => {
    // Arrange
    const onAccept = vi.fn()
    const onSkip = vi.fn()
    const onOpenSheet = vi.fn()
    const { onTouchStart, onTouchMove, onTouchEnd, finishExit } = useCardSwipe({
      onAccept,
      onSkip,
      onOpenSheet,
      swipeThreshold: 100,
    })

    // Act
    onTouchStart(touchStart(260, 300))
    onTouchMove(touchMove(100, 300)) // 160px left
    onTouchEnd(touchEnd(100, 300))
    finishExit()

    // Assert
    expect(onSkip).toHaveBeenCalledOnce()
    expect(onAccept).not.toHaveBeenCalled()
    expect(onOpenSheet).not.toHaveBeenCalled()
  })

  it('should not commit and should spring back when the horizontal drag falls short of the threshold', () => {
    // Arrange
    const onAccept = vi.fn()
    const onSkip = vi.fn()
    const onOpenSheet = vi.fn()
    const { onTouchStart, onTouchMove, onTouchEnd, finishExit, dragX } = useCardSwipe({
      onAccept,
      onSkip,
      onOpenSheet,
      swipeThreshold: 100,
    })

    // Act
    onTouchStart(touchStart(100, 300))
    onTouchMove(touchMove(150, 300)) // only 50px right
    onTouchEnd(touchEnd(150, 300))
    finishExit()

    // Assert
    expect(dragX.value).toBe(0)
    expect(onAccept).not.toHaveBeenCalled()
    expect(onSkip).not.toHaveBeenCalled()
  })

  it('should open the action sheet on an upward swipe without ever committing accept or skip', () => {
    // Arrange
    const onAccept = vi.fn()
    const onSkip = vi.fn()
    const onOpenSheet = vi.fn()
    const { onTouchStart, onTouchMove, onTouchEnd, finishExit } = useCardSwipe({
      onAccept,
      onSkip,
      onOpenSheet,
      verticalThreshold: 50,
    })

    // Act
    onTouchStart(touchStart(100, 300))
    onTouchMove(touchMove(100, 220)) // 80px up, no sideways drift
    onTouchEnd(touchEnd(100, 220))
    finishExit()

    // Assert
    expect(onOpenSheet).toHaveBeenCalledOnce()
    expect(onAccept).not.toHaveBeenCalled()
    expect(onSkip).not.toHaveBeenCalled()
  })

  it('should lock to horizontal and never open the sheet during a mostly-sideways drag with some vertical drift', () => {
    // Arrange
    const onAccept = vi.fn()
    const onSkip = vi.fn()
    const onOpenSheet = vi.fn()
    const { onTouchStart, onTouchMove, onTouchEnd, finishExit } = useCardSwipe({
      onAccept,
      onSkip,
      onOpenSheet,
      swipeThreshold: 100,
      verticalThreshold: 50,
    })

    // Act
    onTouchStart(touchStart(100, 300))
    onTouchMove(touchMove(250, 260)) // 150px right, 40px up — horizontal dominates
    onTouchEnd(touchEnd(250, 260))
    finishExit()

    // Assert
    expect(onOpenSheet).not.toHaveBeenCalled()
    expect(onAccept).toHaveBeenCalledOnce()
  })

  it('should reach the same exiting state whether triggered by a completed drag or by calling commit directly', () => {
    // Arrange
    const onAccept = vi.fn()
    const onSkip = vi.fn()
    const onOpenSheet = vi.fn()
    const { commit, finishExit, isExiting, exitDirection } = useCardSwipe({
      onAccept,
      onSkip,
      onOpenSheet,
    })

    // Act
    commit('accept')

    // Assert
    expect(isExiting.value).toBe(true)
    expect(exitDirection.value).toBe('accept')

    // Act
    finishExit()

    // Assert
    expect(onAccept).toHaveBeenCalledOnce()
    expect(isExiting.value).toBe(false)
  })

  it('should call the completion callback only once even if the exit finishes twice', () => {
    // Arrange
    const onAccept = vi.fn()
    const onSkip = vi.fn()
    const onOpenSheet = vi.fn()
    const { commit, finishExit } = useCardSwipe({ onAccept, onSkip, onOpenSheet })

    // Act
    commit('accept')
    finishExit()
    finishExit()

    // Assert
    expect(onAccept).toHaveBeenCalledOnce()
  })
})
