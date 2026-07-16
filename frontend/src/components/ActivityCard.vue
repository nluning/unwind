<template>
  <div
    class="flex-1 flex flex-col gap-4 uw-swipe-card"
    :class="{
      'uw-swipe-card--settling': !isDragging && !isExiting,
      'uw-swipe-card--exiting-accept': isExiting && exitDirection === 'accept',
      'uw-swipe-card--exiting-skip': isExiting && exitDirection === 'skip',
    }"
    :style="{ transform: `translateX(${dragX}px) rotate(${rotation}deg)` }"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @transitionend="handleTransitionEnd"
  >
    <h1 class="uw-title">
      {{ title }}
    </h1>

    <p v-if="description" class="uw-body">
      {{ description }}
    </p>

    <div class="uw-chips">
      <span class="uw-chip">
        {{ $t('activity.duration', { minutes: activity.suggested_duration }) }}
      </span>
    </div>

    <span
      class="uw-swipe-stamp uw-swipe-stamp--accept"
      aria-hidden="true"
      :style="{ opacity: dragIntent === 'accept' ? dragProgress : 0 }"
    >
      <CheckIcon :size="28" :stroke-width="3" />
    </span>
    <span
      class="uw-swipe-stamp uw-swipe-stamp--skip"
      aria-hidden="true"
      :style="{ opacity: dragIntent === 'skip' ? dragProgress : 0 }"
    >
      <CloseIcon :size="28" :stroke-width="3" />
    </span>

    <div class="uw-actions mt-auto">
      <button
        class="uw-swipe-actions__skip"
        :aria-label="$t('activity.skip')"
        @click="handleSkipClick"
      >
        <span class="uw-swipe-actions__icon" aria-hidden="true">
          <CloseIcon :size="22" :stroke-width="1.75" />
        </span>
      </button>

      <button
        class="uw-swipe-actions__accept"
        :aria-label="$t('activity.accept')"
        @click="handleAcceptClick"
      >
        <span class="uw-swipe-actions__icon" aria-hidden="true">
          <CheckIcon :size="22" :stroke-width="1.75" />
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Activity } from '../types/activity.js'
import { useActivityTranslation } from '../composables/useActivityTranslation.js'
import { useCardSwipe } from '../composables/useCardSwipe.js'
import CheckIcon from './icons/CheckIcon.vue'
import CloseIcon from './icons/CloseIcon.vue'

const props = defineProps<{
  activity: Activity
}>()

const emit = defineEmits<{
  accept: []
  skip: []
  'open-sheet': []
}>()

const { titleFor, descriptionFor } = useActivityTranslation()

const title = computed(() => titleFor(props.activity))
const description = computed(() => descriptionFor(props.activity))

const {
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
} = useCardSwipe({
  onAccept: () => emit('accept'),
  onSkip: () => emit('skip'),
  onOpenSheet: () => emit('open-sheet'),
})

function handleAcceptClick() {
  commit('accept')
}

function handleSkipClick() {
  commit('skip')
}

// Guard against a child element's own transition (e.g. the stamp fading)
// bubbling up and completing the exit early.
function handleTransitionEnd(event: TransitionEvent) {
  if (event.target !== event.currentTarget) return
  finishExit()
}
</script>
