<template>
  <PageShell>
    <PageHeader />
      <!-- Progress dots — across the 5 questions -->
      <div
        v-if="step >= 2 && step <= 6"
        class="flex justify-center gap-1.5 pt-[22px]"
        aria-hidden="true"
      >
        <span
          v-for="n in 5"
          :key="n"
          class="h-1.5 rounded-[3px] transition-all duration-300"
          :class="n === step - 1 ? 'w-[22px] bg-uw-primary' : 'w-1.5 bg-uw-chip'"
        />
      </div>

      <!-- Step 1 — welcome -->
      <template v-if="step === 1">
        <h1 class="uw-title pt-[72px] max-w-[280px]">
          {{ $t('onboarding.heading') }}
        </h1>
        <p class="uw-body">{{ $t('onboarding.intro') }}</p>

        <div class="mt-auto px-[22px] flex items-center justify-between">
          <button class="uw-text-button" @click="handleBackFromIntro">
            {{ $t('onboarding.back') }}
          </button>
          <button class="uw-actions__primary" @click="goNext(2)">
            {{ $t('onboarding.next') }}
            <span class="uw-badge">
              <ForwardIcon />
            </span>
          </button>
        </div>
      </template>

      <!-- Step 2 — consent -->
      <template v-else-if="step === 2">
        <OnboardingStepHeader
          :question-number="1"
          :title="$t('onboarding.consentQuestion')"
        >
          <template #hint>{{ $t('onboarding.consentHint') }}</template>
        </OnboardingStepHeader>

        <OnboardingOptionPills
          :options="consentOptions"
          :model-value="consentPick"
          class="mt-8"
          @update:model-value="(v) => handleConsentPicked(v as 'yes' | 'no')"
        />

        <StepActions
          :show-continue="isRevisit && consentPick !== ''"
          @back="goBack(1)"
          @continue="goNext(3)"
        />
      </template>

      <!-- Step 3 — setting -->
      <template v-else-if="step === 3">
        <OnboardingStepHeader
          :question-number="2"
          :title="$t('onboarding.settingQuestion')"
        />

        <OnboardingOptionPills
          :options="settingOptions"
          :model-value="setting"
          class="mt-8"
          @update:model-value="(v) => handleSettingPicked(v as typeof setting)"
        />

        <StepActions
          :show-continue="isRevisit && setting !== ''"
          @back="goBack(2)"
          @continue="goNext(4)"
        />
      </template>

      <!-- Step 4 — social -->
      <template v-else-if="step === 4">
        <OnboardingStepHeader
          :question-number="3"
          :title="$t('onboarding.socialQuestion')"
        />

        <OnboardingOptionPills
          :options="socialOptions"
          :model-value="social"
          class="mt-8"
          @update:model-value="(v) => handleSocialPicked(v as typeof social)"
        />

        <StepActions
          :show-continue="isRevisit && social !== ''"
          @back="goBack(3)"
          @continue="goNext(5)"
        />
      </template>

      <!-- Step 5 — interests -->
      <template v-else-if="step === 5">
        <OnboardingStepHeader
          :question-number="4"
          :title="$t('onboarding.interestsQuestion')"
        >
          <template #hint>{{ $t('onboarding.interestsHint') }}</template>
        </OnboardingStepHeader>

        <div class="mt-6 px-[22px] flex flex-wrap gap-2">
          <ToggleButton
            v-for="interest in interestOptions"
            :key="interest"
            :selected="interests.includes(interest)"
            @click="toggleInterest(interest)"
          >
            {{ interest }}
          </ToggleButton>
        </div>

        <StepActions
          :show-continue="true"
          @back="goBack(4)"
          @continue="goNext(6)"
        />
      </template>

      <!-- Step 6 — free-text -->
      <template v-else-if="step === 6">
        <OnboardingStepHeader
          :question-number="5"
          :title="$t('onboarding.freeTextQuestion')"
        >
          <template #hint>{{ $t('onboarding.freeTextHint') }}</template>
        </OnboardingStepHeader>

        <div class="mt-6 px-[22px] flex flex-col gap-2">
          <textarea
            v-model="freeText"
            :maxlength="FREE_TEXT_MAX"
            :placeholder="$t('onboarding.freeTextPlaceholder')"
            rows="5"
            class="w-full rounded-2xl border border-uw-border-soft bg-transparent text-uw-ink p-3 font-sans text-base resize-none focus:outline-none focus:border-uw-primary"
          />
          <span class="self-end text-xs text-uw-ink-mute">
            {{ freeText.length }} / {{ FREE_TEXT_MAX }}
          </span>
        </div>

        <div class="mt-auto mb-12 px-[22px] flex items-center justify-between">
          <button class="uw-text-button" @click="goBack(5)">
            {{ $t('onboarding.back') }}
          </button>
          <button class="uw-actions__primary" @click="handleGenerate">
            {{ $t('onboarding.generate') }}
            <span class="uw-badge">
              <CheckIcon />
            </span>
          </button>
        </div>
      </template>

      <!-- Step 7 — loading -->
      <div
        v-else-if="step === 7"
        class="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <span class="spinner" />
        <p class="uw-body !pt-0 !max-w-none">
          {{ $t('onboarding.generating') }}
        </p>
      </div>

      <!-- Step 8 — done -->
      <template v-else-if="step === 8">
        <h2 class="uw-title pt-[72px] max-w-[280px]">
          {{ $t('onboarding.doneHeading') }}
        </h2>
        <p class="uw-body">
          {{ $t('onboarding.done', { count: generatedCount }) }}
        </p>

        <div class="mt-auto mb-12 px-[22px] flex justify-end">
          <button class="uw-actions__primary" @click="router.push({ name: 'suggest' })">
            {{ $t('onboarding.start') }}
            <span class="uw-badge">
              <ForwardIcon />
            </span>
          </button>
        </div>
      </template>

      <p
        v-if="error"
        class="text-center text-sm text-uw-ink-mute px-6 py-3"
      >
        {{ error }}
        <button
          v-if="step === 7"
          class="block mx-auto mt-2 uw-text-button underline"
          @click="handleGenerate"
        >
          {{ $t('suggest.retry') }}
        </button>
      </p>
  </PageShell>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../api/client.js'
import { useAuth } from '../composables/useAuth.js'
import { resetActivitiesState } from '../composables/useActivities.js'
import OnboardingOptionPills from '../components/OnboardingOptionPills.vue'
import PageShell from '../components/PageShell.vue'
import ForwardIcon from '../components/icons/ForwardIcon.vue'
import CheckIcon from '../components/icons/CheckIcon.vue'
import OnboardingStepHeader from '../components/OnboardingStepHeader.vue'
import ToggleButton from '../components/ToggleButton.vue'
import StepActions from '../components/OnboardingStepActions.vue'
import PageHeader from '@/components/PageHeader.vue'

const router = useRouter()
const { fetchMe } = useAuth()
const { t } = useI18n()

const FREE_TEXT_MAX = 500

const step = ref(1)
const error = ref('')

// Track which question steps the user has already left at least once.
// Auto-advance fires only on first pass; on revisit (back-navigation),
// picking an option just updates the value and the user must press
// Volgende. Avoids the silent-no-op trap where re-tapping the current
// answer would auto-advance without visible state change.
const visited = ref(new Set<number>())
const isRevisit = computed(() => visited.value.has(step.value))

const consentPick = ref<'' | 'yes' | 'no'>('')
const memoryConsent = computed(() => consentPick.value === 'yes')
const setting = ref<'' | 'indoor' | 'outdoor' | 'no_preference'>('')
const social = ref<'' | 'alone' | 'with_others' | 'no_preference'>('')
const interests = ref<string[]>([])
const freeText = ref('')
const generatedCount = ref(0)

const settingOptions = computed(() => [
  { value: 'indoor', label: t('onboarding.settingIndoor') },
  { value: 'outdoor', label: t('onboarding.settingOutdoor') },
  { value: 'no_preference', label: t('onboarding.settingBoth') },
])

const socialOptions = computed(() => [
  { value: 'alone', label: t('onboarding.socialAlone') },
  { value: 'with_others', label: t('onboarding.socialWithOthers') },
  { value: 'no_preference', label: t('onboarding.socialBoth') },
])

const consentOptions = computed(() => [
  { value: 'yes', label: t('onboarding.consentYes') },
  { value: 'no', label: t('onboarding.consentNo') },
])

// See onboardingPrompt.ts — these Dutch strings are sent to Claude verbatim,
// so they aren't i18n keys. If another locale is added, introduce a translation
// layer that maps the UI label to a stable prompt value.
const interestOptions = [
  'Creatief', 'Puzzels & denken', 'Bewegen', 'Natuur',
  'Muziek', 'Koken', 'Lezen', 'Niks doen',
]

function goNext(target: number) {
  visited.value.add(step.value)
  step.value = target
}

function goBack(target: number) {
  step.value = target
}

function handleBackFromIntro() {
  // Step 1 sits behind the menu action "Verzin activiteiten voor me".
  // history.length > 1 means we have somewhere to go back to; otherwise
  // (deep link, fresh tab) fall through to /suggest.
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push({ name: 'suggest' })
  }
}

function toggleInterest(interest: string) {
  interests.value = interests.value.includes(interest)
    ? interests.value.filter((item) => item !== interest)
    : [...interests.value, interest]
}

function handleConsentPicked(value: 'yes' | 'no') {
  consentPick.value = value
  if (!isRevisit.value) {
    goNext(3)
  }
}

function handleSettingPicked(value: typeof setting.value) {
  setting.value = value
  if (!isRevisit.value) {
    goNext(4)
  }
}

function handleSocialPicked(value: typeof social.value) {
  social.value = value
  if (!isRevisit.value) {
    goNext(5)
  }
}

async function handleGenerate() {
  visited.value.add(step.value)
  step.value = 7
  error.value = ''

  try {
    const result = await api<{ activities: unknown[]; memories_saved: number }>(
      '/onboarding/generate',
      {
        method: 'POST',
        body: JSON.stringify({
          setting: setting.value,
          social: social.value,
          interests: interests.value,
          memory_consent: memoryConsent.value,
          free_text: freeText.value.trim() || undefined,
        }),
      }
    )
    generatedCount.value = result.activities.length
    // Refresh /me so the router's needsOnboarding gate flips before the
    // user navigates away from this page.
    await fetchMe()
    // Invalidate the module-level activities cache so /suggest re-fetches
    // and renders the newly-generated items instead of the stale list.
    resetActivitiesState()
    step.value = 8
  } catch {
    error.value = t('onboarding.error')
  }
}
</script>
