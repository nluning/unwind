<template>
  <div class="fixed inset-0 z-40 flex items-end justify-center">
    <!-- Backdrop — tap to dismiss, like ActivityActionSheet. `mousedown.prevent`
         stops the browser moving focus to <body> on a click here, which would
         break Escape and the Tab trap (both listen on the dialog, so they only
         work while focus is inside it). -->
    <div
      class="absolute inset-0 bg-black/30"
      aria-hidden="true"
      data-test="backdrop"
      @mousedown.prevent
      @click="$emit('dismiss')"
    />

    <div
      ref="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-question"
      tabindex="-1"
      class="relative w-full max-w-[480px] rounded-t-2xl border-t border-uw-border-soft px-5 pb-7 pt-7 flex flex-col items-center gap-6"
      :style="{ background: 'var(--uw-card, rgba(255,255,255,0.97))' }"
      @keydown.esc="$emit('dismiss')"
      @keydown.tab="trapFocus"
    >
      <!-- Which activity this is about, as a quiet reminder: the question can
           appear hours after the activity, when the app is opened again. -->
      <div class="flex flex-col items-center gap-1 text-center max-w-full px-8">
        <h2
          id="feedback-question"
          class="font-serif text-xl text-uw-ink m-0"
        >
          {{ $t('feedback.question') }}
        </h2>
        <i18n-t
          keypath="feedback.after"
          tag="p"
          class="text-sm text-uw-ink-mute m-0 max-w-full truncate"
          data-test="activity-title"
        >
          <template #activity>
            <em>{{ titleFor(activity) }}</em>
          </template>
        </i18n-t>
      </div>

      <!-- Slechter on the left, beter on the right (less → more). No visible
           captions: the sign carries the meaning, the label is for assistive tech. -->
      <div class="flex items-center justify-center gap-6">
        <button
          v-for="outcome in feedbackOutcomesLeftToRight"
          :key="outcome"
          type="button"
          class="uw-feedback-option"
          :class="`uw-feedback-option--${outcome}`"
          :aria-label="$t(`feedback.${outcome}`)"
          :data-test="`answer-${outcome}`"
          @click="$emit('answer', outcome)"
        >
          <component :is="feedbackSigns[outcome]" />
        </button>
      </div>

      <!-- Skip: last in tab order (after the answers) so Enter on the first Tab
           stop can't accidentally mean "never ask again"; placed top right. -->
      <button
        type="button"
        class="uw-menu-btn absolute top-3 right-3"
        :aria-label="$t('feedback.skip')"
        data-test="skip"
        @click="$emit('dismiss')"
      >
        <CloseIcon />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { Activity } from '../types/activity.js'
import type { FeedbackOutcome } from '../composables/usePostActivityFeedback.js'
import { useActivityTranslation } from '../composables/useActivityTranslation.js'
import { feedbackSigns, feedbackOutcomesLeftToRight } from './feedbackSigns.js'
import CloseIcon from './icons/CloseIcon.vue'

defineProps<{
  activity: Pick<Activity, 'title' | 'source'>
}>()

defineEmits<{
  answer: [outcome: FeedbackOutcome]
  dismiss: []
}>()

const { titleFor } = useActivityTranslation()

const dialog = ref<HTMLElement | null>(null)

// Where the user was before the question appeared, so closing it puts them back.
const previouslyFocused = document.activeElement as HTMLElement | null

onMounted(() => {
  // Move focus into the dialog so Escape works and screen readers land here.
  dialog.value?.focus()
})

onBeforeUnmount(() => {
  if (previouslyFocused?.isConnected) previouslyFocused.focus()
})

// Keep Tab / Shift+Tab inside the dialog while it's open.
function trapFocus(event: KeyboardEvent) {
  const buttons = Array.from(dialog.value?.querySelectorAll<HTMLElement>('button') ?? [])
  const first = buttons[0]
  const last = buttons[buttons.length - 1]
  if (!first || !last) return

  const active = document.activeElement
  if (event.shiftKey && (active === first || active === dialog.value)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}
</script>
