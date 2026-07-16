<template>
  <div
    class="fixed inset-0 z-30 flex items-end justify-center"
  >
    <!-- Backdrop — tap to dismiss. -->
    <div
      class="absolute inset-0 bg-black/30"
      @click="$emit('close')"
    />

    <div
      ref="sheet"
      class="uw-sheet relative w-full max-w-[480px] rounded-t-2xl border-t border-uw-border-soft px-5 pb-7 pt-2 max-h-[80vh] overflow-y-auto"
      :style="{ background: 'var(--uw-card, rgba(255,255,255,0.97))' }"
      role="dialog"
      aria-modal="true"
      :aria-label="activity.title"
      tabindex="-1"
      @keydown.esc="$emit('close')"
    >
      <!-- Grabber: swipe down here to close (avoids fighting list scroll). -->
      <div
        class="pt-1 pb-3 -mx-5 px-5 cursor-grab"
        @touchstart="onGrabberStart"
        @touchend="onGrabberEnd"
      >
        <div
          class="mx-auto h-1 w-10 rounded-full bg-uw-border-soft"
          aria-hidden="true"
        />
      </div>

      <!-- Menu: three bare pictograms. Labels live in aria-label only.
           `group` lets the inner circle scale on button hover. -->
      <div
        v-if="view === 'menu'"
        class="flex items-center justify-around py-2"
      >
        <button
          type="button"
          class="group w-16 h-16 inline-flex items-center justify-center border-0 bg-transparent p-0 cursor-pointer"
          :aria-label="$t('suggest.actions.more')"
          @click="openMore"
        >
          <span class="w-[46px] h-[46px] rounded-full inline-flex items-center justify-center transition group-hover:scale-[1.06] font-serif font-bold text-[20px] text-uw-primary [-webkit-text-stroke:0.3px_var(--uw-primary)]">+3</span>
        </button>

        <button
          type="button"
          class="group w-16 h-16 inline-flex items-center justify-center border-0 bg-transparent p-0 cursor-pointer"
          :aria-label="confirmingDelete ? $t('activitiesList.deleteConfirm') : $t('suggest.actions.remove')"
          @click="handleDeleteTap"
        >
          <span
            class="w-[46px] h-[46px] rounded-full inline-flex items-center justify-center transition group-hover:scale-[1.06]"
            :class="confirmingDelete ? 'bg-uw-danger text-uw-primary-fg' : 'text-uw-danger'"
          >
            <TrashIcon :size="22" />
          </span>
        </button>

        <button
          type="button"
          class="group w-16 h-16 inline-flex items-center justify-center border-0 bg-transparent p-0 cursor-pointer"
          :aria-label="$t('suggest.actions.chat')"
          @click="$emit('chat')"
        >
          <span class="w-[46px] h-[46px] rounded-full inline-flex items-center justify-center transition group-hover:scale-[1.06] text-uw-primary">
            <ChatBubbleIcon :size="24" />
          </span>
        </button>
      </div>

      <!-- Results: 3 suggestions anchored to this activity ("Meer van dit"). -->
      <template v-else>
        <StateLoading v-if="loading">{{ $t('suggestFromList.generating') }}</StateLoading>

        <template v-else-if="failed">
          <StateMessage v-if="rateLimitMessage">{{ rateLimitMessage }}</StateMessage>
          <StateError v-else @retry="openMore" />
        </template>

        <SuggestionList
          v-else
          :suggestions="suggestions"
          :save="save"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Activity } from '../types/activity.js'
import { useSuggestFromList } from '../composables/useSuggestFromList.js'
import SuggestionList from './SuggestionList.vue'
import StateLoading from './StateLoading.vue'
import StateError from './StateError.vue'
import StateMessage from './StateMessage.vue'
import TrashIcon from './icons/TrashIcon.vue'
import ChatBubbleIcon from './icons/ChatBubbleIcon.vue'

const props = defineProps<{
  activity: Activity
}>()

const emit = defineEmits<{
  delete: []
  chat: []
  close: []
}>()

const view = ref<'menu' | 'results'>('menu')
const sheet = ref<HTMLElement | null>(null)
const confirmingDelete = ref(false)

const { suggestions, loading, failed, rateLimitMessage, generate, save } = useSuggestFromList()

function openMore() {
  view.value = 'results'
  generate(props.activity.id)
}

// Two-tap delete: first tap arms ("Zeker weten?"), second tap confirms.
function handleDeleteTap() {
  if (confirmingDelete.value) {
    emit('delete')
  } else {
    confirmingDelete.value = true
  }
}

// Swipe-down on the grabber closes the sheet. Local (not useCardSwipe, whose
// vertical branch is upward-only) and scoped to the grabber so it never
// competes with list scroll.
const CLOSE_THRESHOLD = 40
let grabberStartY = 0

function onGrabberStart(event: TouchEvent) {
  grabberStartY = event.touches[0]?.clientY ?? 0
}

function onGrabberEnd(event: TouchEvent) {
  const endY = event.changedTouches[0]?.clientY ?? 0
  if (endY - grabberStartY >= CLOSE_THRESHOLD) emit('close')
}

onMounted(() => {
  // Move focus into the dialog so Escape works and screen readers land here.
  sheet.value?.focus()
})
</script>
