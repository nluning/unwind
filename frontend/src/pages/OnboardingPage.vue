<template>
  <PageShell>
      <!-- Progress dots — only across the 4 questions -->
      <div
        v-if="step >= 2 && step <= 5"
        class="flex justify-center gap-1.5 pt-[22px]"
        aria-hidden="true"
      >
        <span
          v-for="n in 4"
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
          <button class="uw-text-button" @click="handleSkip">
            {{ $t('onboarding.skip') }}
          </button>
          <button class="uw-actions__primary" @click="step = 2">
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
        />

        <div class="mt-auto mb-14 px-7 flex gap-3">
          <button
            v-for="option in consentOptions"
            :key="option.value"
            class="flex-1 py-4 rounded-full border border-uw-border-soft text-uw-ink text-sm font-medium cursor-pointer transition-colors hover:bg-uw-chip"
            @click="handleConsentPicked(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </template>

      <!-- Step 3 — setting -->
      <template v-else-if="step === 3">
        <OnboardingStepHeader
          :question-number="2"
          :title="$t('onboarding.settingQuestion')"
        />

        <OnboardingOptionList
          :options="settingOptions"
          :model-value="setting"
          class="mt-auto mb-14 mx-7"
          @update:model-value="(v) => { setting = v as typeof setting; step = 4 }"
        />
      </template>

      <!-- Step 4 — social -->
      <template v-else-if="step === 4">
        <OnboardingStepHeader
          :question-number="3"
          :title="$t('onboarding.socialQuestion')"
        />

        <OnboardingOptionList
          :options="socialOptions"
          :model-value="social"
          class="mt-auto mb-14 mx-7"
          @update:model-value="(v) => { social = v as typeof social; step = 5 }"
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

        <div class="mt-auto mb-12 px-[22px] flex justify-end">
          <button class="uw-actions__primary" @click="handleGenerate">
            {{ $t('onboarding.generate') }}
            <span class="uw-badge">
              <CheckIcon />
            </span>
          </button>
        </div>
      </template>

      <!-- Step 6 — loading -->
      <div
        v-else-if="step === 6"
        class="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <span class="spinner" />
        <p class="uw-body !pt-0 !max-w-none">
          {{ $t('onboarding.generating') }}
        </p>
      </div>

      <!-- Step 7 — done -->
      <template v-else-if="step === 7">
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
          v-if="step === 6"
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
import OnboardingOptionList from '../components/OnboardingOptionList.vue'
import PageShell from '../components/PageShell.vue'
import ForwardIcon from '../components/icons/ForwardIcon.vue'
import CheckIcon from '../components/icons/CheckIcon.vue'
import OnboardingStepHeader from '../components/OnboardingStepHeader.vue'
import ToggleButton from '../components/ToggleButton.vue'

const router = useRouter()
const { fetchMe } = useAuth()
const { t } = useI18n()

const step = ref(1)
const error = ref('')

const memoryConsent = ref<boolean | null>(null)
const setting = ref<'' | 'indoor' | 'outdoor' | 'no_preference'>('')
const social = ref<'' | 'alone' | 'with_others' | 'no_preference'>('')
const interests = ref<string[]>([])
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

function toggleInterest(interest: string) {
  interests.value = interests.value.includes(interest)
    ? interests.value.filter((item) => item !== interest)
    : [...interests.value, interest]
}

function handleConsentPicked(value: string) {
  memoryConsent.value = value === 'yes'
  step.value = 3
}

async function handleGenerate() {
  step.value = 6
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
          memory_consent: memoryConsent.value ?? false,
        }),
      }
    )
    generatedCount.value = result.activities.length
    // Refresh /me so the router's needsOnboarding gate flips before the
    // user navigates away from this page.
    await fetchMe()
    step.value = 7
  } catch {
    error.value = t('onboarding.error')
  }
}

async function handleSkip() {
  try {
    await api('/onboarding/skip', { method: 'POST' })
    await fetchMe()
    router.push({ name: 'suggest' })
  } catch {
    error.value = t('onboarding.error')
  }
}

</script>

