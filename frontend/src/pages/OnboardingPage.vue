<template>
  <main class="flex flex-col items-center px-4 py-8 max-w-md mx-auto gap-6">
    <!-- Step 1: Welcome + consent -->
    <template v-if="step === 1">
      <h1 class="text-xl">{{ $t('onboarding.heading') }}</h1>
      <p class="text-dim text-sm text-center leading-relaxed">
        {{ $t('onboarding.intro') }}
      </p>

      <p class="text-sm text-center leading-relaxed">
        {{ $t('onboarding.consentQuestion') }}
      </p>
      <div class="flex gap-3 w-full">
        <button
          class="flex-1 py-3.5 rounded-xl text-base cursor-pointer border-2 transition-colors"
          :class="memoryConsent === true
            ? 'border-primary bg-primary text-white'
            : 'border-outline bg-surface text-dim hover:border-primary'"
          @click="memoryConsent = true"
        >
          {{ $t('onboarding.consentYes') }}
        </button>
        <button
          class="flex-1 py-3.5 rounded-xl text-base cursor-pointer border-2 transition-colors"
          :class="memoryConsent === false
            ? 'border-primary bg-primary text-white'
            : 'border-outline bg-surface text-dim hover:border-primary'"
          @click="memoryConsent = false"
        >
          {{ $t('onboarding.consentNo') }}
        </button>
      </div>
      <button
        :disabled="memoryConsent === null"
        class="w-full py-3.5 rounded-xl bg-primary text-white text-base cursor-pointer border-none disabled:opacity-40"
        @click="step = 2"
      >
        {{ $t('onboarding.next') }}
      </button>
      <LinkButton @click="handleSkip">{{ $t('onboarding.skip') }}</LinkButton>
    </template>

    <!-- Step 2: Setting -->
    <template v-else-if="step === 2">
      <h2 class="text-lg">{{ $t('onboarding.settingQuestion') }}</h2>
      <div class="flex flex-col gap-3 w-full">
        <button
          v-for="option in settingOptions"
          :key="option.value"
          class="py-3.5 px-6 rounded-xl text-base cursor-pointer border-2 transition-colors"
          :class="setting === option.value
            ? 'border-primary bg-primary text-white'
            : 'border-outline bg-surface text-dim hover:border-primary'"
          @click="setting = option.value; step = 3"
        >
          {{ option.label }}
        </button>
      </div>
      <LinkButton @click="handleSkip">{{ $t('onboarding.skip') }}</LinkButton>
    </template>

    <!-- Step 3: Social -->
    <template v-else-if="step === 3">
      <h2 class="text-lg">{{ $t('onboarding.socialQuestion') }}</h2>
      <div class="flex flex-col gap-3 w-full">
        <button
          v-for="option in socialOptions"
          :key="option.value"
          class="py-3.5 px-6 rounded-xl text-base cursor-pointer border-2 transition-colors"
          :class="social === option.value
            ? 'border-primary bg-primary text-white'
            : 'border-outline bg-surface text-dim hover:border-primary'"
          @click="social = option.value; step = 4"
        >
          {{ option.label }}
        </button>
      </div>
      <LinkButton @click="handleSkip">{{ $t('onboarding.skip') }}</LinkButton>
    </template>

    <!-- Step 4: Interests -->
    <template v-else-if="step === 4">
      <h2 class="text-lg">{{ $t('onboarding.interestsQuestion') }}</h2>
      <p class="text-dim text-xs">{{ $t('onboarding.interestsHint') }}</p>
      <div class="flex flex-wrap gap-2 justify-center">
        <button
          v-for="interest in interestOptions"
          :key="interest"
          class="py-2.5 px-5 rounded-full text-sm cursor-pointer border-2 transition-colors"
          :class="interests.includes(interest)
            ? 'border-primary bg-primary text-white'
            : 'border-outline bg-surface text-dim hover:border-primary'"
          @click="toggleInterest(interest)"
        >
          {{ interest }}
        </button>
      </div>
      <button
        class="w-full py-3.5 rounded-xl bg-primary text-white text-base cursor-pointer border-none"
        @click="handleGenerate"
      >
        {{ $t('onboarding.generate') }}
      </button>
      <LinkButton @click="handleSkip">{{ $t('onboarding.skip') }}</LinkButton>
    </template>

    <!-- Step 5: Loading -->
    <template v-else-if="step === 5">
      <span class="spinner" />
      <p class="text-dim text-sm">{{ $t('onboarding.generating') }}</p>
    </template>

    <!-- Step 6: Done -->
    <template v-else-if="step === 6">
      <h2 class="text-lg">{{ $t('onboarding.doneHeading') }}</h2>
      <p class="text-dim text-sm">
        {{ $t('onboarding.done', { count: generatedCount }) }}
      </p>
      <button
        class="w-full py-3.5 rounded-xl bg-primary text-white text-base cursor-pointer border-none"
        @click="router.push({ name: 'suggest' })"
      >
        {{ $t('onboarding.start') }}
      </button>
    </template>

    <!-- Error state -->
    <template v-if="error">
      <p class="text-error text-sm">{{ error }}</p>
      <LinkButton v-if="step === 5" @click="handleGenerate">
        {{ $t('suggest.retry') }}
      </LinkButton>
    </template>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../api/client.js'
import LinkButton from '../components/LinkButton.vue'

const router = useRouter()
const { t } = useI18n()

const step = ref(1)
const error = ref('')

// Form state
const memoryConsent = ref<boolean | null>(null)
const setting = ref<'indoor' | 'outdoor' | 'no_preference'>('no_preference')
const social = ref<'alone' | 'with_others' | 'no_preference'>('no_preference')
const interests = ref<string[]>([])
const generatedCount = ref(0)

const settingOptions = [
  { value: 'indoor' as const, label: t('onboarding.settingIndoor') },
  { value: 'outdoor' as const, label: t('onboarding.settingOutdoor') },
  { value: 'no_preference' as const, label: t('onboarding.settingBoth') },
]

const socialOptions = [
  { value: 'alone' as const, label: t('onboarding.socialAlone') },
  { value: 'with_others' as const, label: t('onboarding.socialWithOthers') },
  { value: 'no_preference' as const, label: t('onboarding.socialBoth') },
]

// TODO: These are hardcoded Dutch strings, not i18n keys. They're sent directly
// to Claude in the onboarding prompt, so i18n would require a mapping layer
// (translated label → prompt-compatible value). Fine for Dutch-only; revisit if
// the app ever supports multiple languages.
const interestOptions = [
  'Creatief',
  'Puzzels & denken',
  'Bewegen',
  'Natuur',
  'Muziek',
  'Koken',
  'Lezen',
  'Niks doen',
]

function toggleInterest(interest: string) {
  if (interests.value.includes(interest)) {
    interests.value = interests.value.filter(item => item !== interest)
  } else {
    interests.value = [...interests.value, interest]
  }
}

async function handleGenerate() {
  step.value = 5
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
    localStorage.setItem('unwind-onboarding-done', 'true')
    step.value = 6
  } catch {
    error.value = t('onboarding.error')
  }
}

function handleSkip() {
  localStorage.setItem('unwind-onboarding-done', 'true')
  router.push({ name: 'suggest' })
}
</script>
