import type { Component } from 'vue'
import type { FeedbackOutcome } from '../composables/usePostActivityFeedback.js'
import ChevronUpIcon from './icons/ChevronUpIcon.vue'
import ChevronDownIcon from './icons/ChevronDownIcon.vue'
import WaveIcon from './icons/WaveIcon.vue'

// The pictogram for each post-activity answer. Shared by the question
// (FeedbackInterstitial) and the stats page so the two can't drift apart.
export const feedbackSigns: Record<FeedbackOutcome, Component> = {
  better: ChevronUpIcon,
  same: WaveIcon,
  worse: ChevronDownIcon,
}

// Left to right: less → more.
export const feedbackOutcomesLeftToRight: FeedbackOutcome[] = ['worse', 'same', 'better']
