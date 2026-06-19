// Minimal swipe-up detection — no gesture library (none installed; not worth a
// dependency for one gesture). Bind the returned handlers to a touch surface:
//   <div @touchstart="onTouchStart" @touchend="onTouchEnd">
// `onSwipeUp` fires when the finger travels far enough upward without drifting
// too far sideways (so a horizontal scroll/swipe doesn't trigger it).

interface SwipeUpOptions {
  // Minimum upward travel in px before it counts as a swipe-up.
  threshold?: number
  // Max horizontal drift (px) still considered "vertical enough".
  maxHorizontal?: number
}

const DEFAULT_THRESHOLD = 50
const DEFAULT_MAX_HORIZONTAL = 60

export function useSwipeUp(onSwipeUp: () => void, options: SwipeUpOptions = {}) {
  const threshold = options.threshold ?? DEFAULT_THRESHOLD
  const maxHorizontal = options.maxHorizontal ?? DEFAULT_MAX_HORIZONTAL

  let startX = 0
  let startY = 0
  let tracking = false

  function onTouchStart(event: TouchEvent) {
    const touch = event.touches[0]
    if (!touch) return
    startX = touch.clientX
    startY = touch.clientY
    tracking = true
  }

  function onTouchEnd(event: TouchEvent) {
    if (!tracking) return
    tracking = false

    const touch = event.changedTouches[0]
    if (!touch) return

    const deltaY = startY - touch.clientY // positive = moved up
    const deltaX = Math.abs(touch.clientX - startX)

    if (deltaY >= threshold && deltaX <= maxHorizontal) {
      onSwipeUp()
    }
  }

  return { onTouchStart, onTouchEnd }
}
