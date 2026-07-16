// Card gesture composable — touch-only (no mouse/pointer events), so dragging
// is unreachable from a desktop mouse; desktop always uses the buttons.
//
// A single touch is axis-locked once it clears a small deadzone: mostly
// horizontal becomes a left/right drag (accept/skip), mostly vertical-upward
// behaves like the old useSwipeUp (open the action sheet, no live feedback).
// Locking prevents a gesture from ever reading as both.
//
// Commit is two-phase: touchend (or a direct `commit()` call from a button
// click) only decides the direction and flips `isExiting` — it does not fire
// `onAccept`/`onSkip` yet. The component wires `finishExit()` to the CSS exit
// transition's `transitionend`, so the underlying activity never swaps out
// from under a still-animating card. `finishExit()` is a no-op once already
// consumed, so a transform+opacity transition firing twice doesn't double-fire.

import { ref, computed } from 'vue'

type SwipeDirection = 'accept' | 'skip'

interface CardSwipeOptions {
  onAccept: () => void
  onSkip: () => void
  onOpenSheet: () => void
  // Minimum horizontal travel (px) to commit to accept/skip.
  swipeThreshold?: number
  // Minimum upward travel (px) to open the action sheet.
  verticalThreshold?: number
  // Travel (px) before a gesture locks to an axis at all.
  deadzone?: number
  // Horizontal travel (px) before the drag starts reading as an intent
  // (drives the stamp reveal) — smaller than swipeThreshold on purpose.
  revealThreshold?: number
  // Rotation (deg) at a full-threshold drag.
  maxRotation?: number
}

const DEFAULT_SWIPE_THRESHOLD = 100
const DEFAULT_VERTICAL_THRESHOLD = 50
const DEFAULT_DEADZONE = 10
const DEFAULT_REVEAL_THRESHOLD = 10
const DEFAULT_MAX_ROTATION = 8
// Comfortably past any real viewport (mobile-first, single-column layout) —
// `commit()` jumps `dragX` here so the CSS transition has something to
// animate. Without this, a button click (which starts at dragX: 0) would
// never move, no `transitionend` would fire, and the exit would hang forever.
const EXIT_DISTANCE = 1200

export function useCardSwipe(options: CardSwipeOptions) {
  const swipeThreshold = options.swipeThreshold ?? DEFAULT_SWIPE_THRESHOLD
  const verticalThreshold = options.verticalThreshold ?? DEFAULT_VERTICAL_THRESHOLD
  const deadzone = options.deadzone ?? DEFAULT_DEADZONE
  const revealThreshold = options.revealThreshold ?? DEFAULT_REVEAL_THRESHOLD
  const maxRotation = options.maxRotation ?? DEFAULT_MAX_ROTATION

  let startX = 0
  let startY = 0
  let currentDy = 0

  const axis = ref<'horizontal' | 'vertical' | null>(null)
  const dragX = ref(0)
  const isDragging = ref(false)
  const isExiting = ref(false)
  const exitDirection = ref<SwipeDirection | null>(null)

  const rotation = computed(() => {
    const ratio = Math.max(-1, Math.min(1, dragX.value / swipeThreshold))
    return ratio * maxRotation
  })

  const dragProgress = computed(() => Math.min(Math.abs(dragX.value) / swipeThreshold, 1))

  const dragIntent = computed<SwipeDirection | null>(() => {
    if (Math.abs(dragX.value) < revealThreshold) return null
    return dragX.value > 0 ? 'accept' : 'skip'
  })

  function onTouchStart(event: TouchEvent) {
    const touch = event.touches[0]
    if (!touch) return
    startX = touch.clientX
    startY = touch.clientY
    currentDy = 0
    axis.value = null
    dragX.value = 0
    isDragging.value = true
  }

  function onTouchMove(event: TouchEvent) {
    if (!isDragging.value) return
    const touch = event.touches[0]
    if (!touch) return

    const dx = touch.clientX - startX
    const dy = touch.clientY - startY
    currentDy = dy

    if (axis.value === null) {
      if (Math.abs(dx) < deadzone && Math.abs(dy) < deadzone) return
      axis.value = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
    }

    if (axis.value === 'horizontal') {
      if (event.cancelable) event.preventDefault()
      dragX.value = dx
    }
  }

  function onTouchEnd(_event: TouchEvent) {
    if (!isDragging.value) return
    isDragging.value = false

    if (axis.value === 'horizontal') {
      if (Math.abs(dragX.value) >= swipeThreshold) {
        commit(dragX.value > 0 ? 'accept' : 'skip')
      } else {
        dragX.value = 0
      }
    } else if (axis.value === 'vertical') {
      const deltaY = -currentDy // positive = moved up
      if (deltaY >= verticalThreshold) {
        options.onOpenSheet()
      }
    }

    axis.value = null
  }

  function commit(direction: SwipeDirection) {
    isExiting.value = true
    exitDirection.value = direction
    dragX.value = direction === 'accept' ? EXIT_DISTANCE : -EXIT_DISTANCE
  }

  function finishExit() {
    if (!isExiting.value) return
    const direction = exitDirection.value
    isExiting.value = false
    exitDirection.value = null
    dragX.value = 0

    if (direction === 'accept') options.onAccept()
    else if (direction === 'skip') options.onSkip()
  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    dragX,
    rotation,
    dragIntent,
    dragProgress,
    isDragging,
    isExiting,
    exitDirection,
    commit,
    finishExit,
  }
}
