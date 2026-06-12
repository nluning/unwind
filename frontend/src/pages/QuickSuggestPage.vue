<template>
  <PageShell>
    <PageHeader back @back="$router.back()" />

    <!-- Question phase — three concrete tap-questions, tap-only (plan 21 §5). -->
    <template v-if="phase === 'questions'">
      <!-- Progress dots across the 3 questions -->
      <div class="flex justify-center gap-1.5 pt-[22px]" aria-hidden="true">
        <span
          v-for="n in QUESTION_COUNT"
          :key="n"
          class="h-1.5 rounded-[3px] transition-all duration-300"
          :class="n === step ? 'w-[22px] bg-uw-primary' : 'w-1.5 bg-uw-chip'"
        />
      </div>

      <OnboardingStepHeader
        :question-number="step"
        :total="QUESTION_COUNT"
        :title="$t(currentQuestion.title)"
      />

      <OnboardingOptionPills
        :options="currentQuestion.options"
        :model-value="answers[currentQuestion.key]"
        class="mt-8"
        @update:model-value="handlePick"
      />

      <StepActions
        :show-continue="isRevisit && answers[currentQuestion.key] !== ''"
        @back="handleBack"
        @continue="advance"
      />
    </template>

    <StateLoading v-else-if="phase === 'loading'" />

    <template v-else-if="phase === 'failed'">
      <StateMessage v-if="rateLimitMessage">{{ rateLimitMessage }}</StateMessage>
      <StateError v-else @retry="runGenerate" />
    </template>

    <!-- Done — the user chose "doe dit nu". Calm confirmation, no recording
         (the suggestion is an ephemeral draft with no id). -->
    <SuggestionAccepted v-else-if="phase === 'doing'" @back="$router.push({ name: 'suggest' })" />

    <!-- Result — the single suggestion. -->
    <template v-else-if="phase === 'result' && suggestion">
      <p class="uw-prompt">{{ $t('quickSuggest.resultHeading') }}</p>

      <div class="flex-1 flex flex-col gap-4 px-6">
        <h1 class="uw-title !pt-2">{{ suggestion.title }}</h1>

        <p v-if="suggestion.description" class="uw-body !pt-0 !px-0">
          {{ suggestion.description }}
        </p>

        <div class="uw-chips">
          <span class="uw-chip">
            {{ $t('activity.duration', { minutes: suggestion.duration_minutes }) }}
          </span>
          <span class="uw-chip">
            {{ $t(`categories.${suggestion.category}`, suggestion.category) }}
          </span>
        </div>

        <div class="uw-actions mt-auto mb-2">
          <button class="uw-actions__primary" @click="phase = 'doing'">
            <span class="uw-badge" aria-hidden="true"><CheckIcon /></span>
            {{ $t('quickSuggest.doNow') }}
          </button>

          <button
            v-if="!saved"
            class="uw-actions__secondary"
            :disabled="saving"
            @click="handleSave"
          >
            {{ saving ? '…' : $t('quickSuggest.add') }}
          </button>
          <span v-else class="text-center text-sm text-uw-primary py-2">
            {{ $t('quickSuggest.added') }}
          </span>
        </div>
      </div>

      <div class="px-6 pb-8 flex justify-center">
        <button class="uw-text-button text-sm" @click="runGenerate">
          {{ $t('quickSuggest.regenerate') }}
        </button>
      </div>
    </template>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSuggestFromAnswers, type QuickAnswers } from '../composables/useSuggestFromAnswers.js'
import type { AiActivity } from '../utils/parseActivity.js'
import PageShell from '../components/PageShell.vue'
import PageHeader from '../components/PageHeader.vue'
import OnboardingStepHeader from '../components/OnboardingStepHeader.vue'
import OnboardingOptionPills from '../components/OnboardingOptionPills.vue'
import StepActions from '../components/OnboardingStepActions.vue'
import StateLoading from '../components/StateLoading.vue'
import StateError from '../components/StateError.vue'
import StateMessage from '../components/StateMessage.vue'
import SuggestionAccepted from '../components/SuggestionAccepted.vue'
import CheckIcon from '../components/icons/CheckIcon.vue'

const { t } = useI18n()
const { suggestion, failed, rateLimitMessage, generate, save } = useSuggestFromAnswers()

const QUESTION_COUNT = 3

// '' = unanswered, 'no_preference' = "maakt niet uit" (an explicit tap that
// skips the dimension). Both map to an omitted answer when calling the API.
type AnswerValue = '' | 'indoor' | 'outdoor' | 'alone' | 'with_others' | 'calm' | 'active' | 'no_preference'

const QUESTIONS = [
  {
    key: 'location' as const,
    title: 'quickSuggest.locationQuestion',
    options: [
      { value: 'indoor', label: 'quickSuggest.indoor' },
      { value: 'outdoor', label: 'quickSuggest.outdoor' },
      { value: 'no_preference', label: 'quickSuggest.noPreference' },
    ],
  },
  {
    key: 'social' as const,
    title: 'quickSuggest.socialQuestion',
    options: [
      { value: 'alone', label: 'quickSuggest.alone' },
      { value: 'with_others', label: 'quickSuggest.withOthers' },
      { value: 'no_preference', label: 'quickSuggest.noPreference' },
    ],
  },
  {
    key: 'energy' as const,
    title: 'quickSuggest.energyQuestion',
    options: [
      { value: 'calm', label: 'quickSuggest.calm' },
      { value: 'active', label: 'quickSuggest.active' },
      { value: 'no_preference', label: 'quickSuggest.noPreference' },
    ],
  },
]

type QuestionKey = (typeof QUESTIONS)[number]['key']

const phase = ref<'questions' | 'loading' | 'failed' | 'result' | 'doing'>('questions')
const step = ref(1)
const answers = ref<Record<QuestionKey, AnswerValue>>({ location: '', social: '', energy: '' })

// First-pass auto-advance, like onboarding: on a question already visited
// (back-navigation) a pick just updates the value and the user taps Volgende.
const visited = ref(new Set<number>())
const isRevisit = computed(() => visited.value.has(step.value))

const currentQuestion = computed(() => {
  const q = QUESTIONS[step.value - 1]!
  return {
    key: q.key,
    title: q.title,
    options: q.options.map((option) => ({ value: option.value, label: t(option.label) })),
  }
})

const saved = ref(false)
const saving = ref(false)

function handlePick(value: string) {
  answers.value[currentQuestion.value.key] = value as AnswerValue
  if (!isRevisit.value) advance()
}

function advance() {
  visited.value.add(step.value)
  if (step.value < QUESTION_COUNT) {
    step.value += 1
  } else {
    runGenerate()
  }
}

function handleBack() {
  if (step.value > 1) {
    step.value -= 1
  } else if (window.history.length > 1) {
    // Q1 back leaves the flow.
    history.back()
  }
}

// Map internal answer values to the API payload, dropping unanswered and
// "maakt niet uit" dimensions so the prompt treats them as no-preference.
function toPayload(): QuickAnswers {
  const payload: QuickAnswers = {}
  const { location, social, energy } = answers.value
  if (location === 'indoor' || location === 'outdoor') payload.location = location
  if (social === 'alone' || social === 'with_others') payload.social = social
  if (energy === 'calm' || energy === 'active') payload.energy = energy
  return payload
}

// Titles shown so far this visit, so "Andere suggestie" asks for something new
// rather than getting the same activity back from the same answers + history.
const seen = ref<string[]>([])

async function runGenerate() {
  // Remember the suggestion currently on screen before we replace it.
  const shown = suggestion.value?.title
  if (shown && !seen.value.includes(shown)) seen.value.push(shown)

  phase.value = 'loading'
  saved.value = false
  saving.value = false
  await generate(toPayload(), seen.value)
  if (failed.value) {
    phase.value = 'failed'
  } else {
    phase.value = 'result'
  }
}

async function handleSave() {
  if (!suggestion.value) return
  saving.value = true
  try {
    await save(suggestion.value as AiActivity)
    saved.value = true
  } catch {
    // Leave the button so the user can retry.
  } finally {
    saving.value = false
  }
}
</script>
