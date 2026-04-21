<template>
  <main class="uw-screen" :class="`uw-theme-${theme}`">
    <div v-if="theme === 'playful'" class="uw-screen__wash" aria-hidden="true" />
    <div v-else class="uw-screen__glow" aria-hidden="true" />

    <!-- Progress dots — only after welcome -->
    <div v-if="step >= 2 && step <= 4" class="uw-onb-progress">
      <span v-for="n in 4" :key="n" class="uw-onb-dot" :class="{ 'is-active': n === (step - 1) }"/>
    </div>

    <!-- Step 1 — welcome -->
    <template v-if="step === 1">
      <h1 class="uw-title uw-title--welcome">{{ $t('onboarding.heading') }}</h1>
      <p class="uw-body">{{ $t('onboarding.intro') }}</p>

      <div class="uw-onb-actions">
        <button class="uw-link" @click="handleSkip">{{ $t('onboarding.skip') }}</button>
        <button class="uw-actions__primary" @click="step = 2">
          {{ $t('onboarding.next') }}
          <span class="uw-badge">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8 h 10 M 9 4 l 4 4 -4 4"/></svg>
          </span>
        </button>
      </div>
    </template>

    <!-- Step 2 — setting -->
    <template v-else-if="step === 2">
      <div class="uw-onb-prompt">
        <span class="uw-step-label">{{ $t('onboarding.questionOf', { n: 1, total: 3 }) }}</span>
        <h2 class="uw-step-title">{{ $t('onboarding.settingQuestion') }}</h2>
      </div>
      <OnbOptionList
        :options="settingOptions"
        v-model="setting"
        @update:modelValue="step = 3"
      />
    </template>

    <!-- Step 3 — social -->
    <template v-else-if="step === 3">
      <div class="uw-onb-prompt">
        <span class="uw-step-label">{{ $t('onboarding.questionOf', { n: 2, total: 3 }) }}</span>
        <h2 class="uw-step-title">{{ $t('onboarding.socialQuestion') }}</h2>
      </div>
      <OnbOptionList
        :options="socialOptions"
        v-model="social"
        @update:modelValue="step = 4"
      />
    </template>

    <!-- Step 4 — interests -->
    <template v-else-if="step === 4">
      <div class="uw-onb-prompt">
        <span class="uw-step-label">{{ $t('onboarding.questionOf', { n: 3, total: 3 }) }}</span>
        <h2 class="uw-step-title">{{ $t('onboarding.interestsQuestion') }}</h2>
        <span class="uw-step-hint">{{ $t('onboarding.interestsHint') }}</span>
      </div>
      <div class="uw-interests">
        <button
          v-for="interest in interestOptions"
          :key="interest"
          class="uw-interest"
          :class="{ 'is-selected': interests.includes(interest) }"
          @click="toggleInterest(interest)"
        >{{ interest }}</button>
      </div>
      <div class="uw-onb-actions uw-onb-actions--right">
        <button class="uw-actions__primary" @click="handleGenerate">
          {{ $t('onboarding.generate') }}
          <span class="uw-badge">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 8 6.5 11.5 13 5"/></svg>
          </span>
        </button>
      </div>
    </template>

    <!-- Step 5 — loading -->
    <template v-else-if="step === 5">
      <div class="uw-onb-loading">
        <span class="spinner" />
        <p class="uw-body">{{ $t('onboarding.generating') }}</p>
      </div>
    </template>

    <!-- Step 6 — done -->
    <template v-else-if="step === 6">
      <h2 class="uw-title">{{ $t('onboarding.doneHeading') }}</h2>
      <p class="uw-body">{{ $t('onboarding.done', { count: generatedCount }) }}</p>
      <div class="uw-onb-actions uw-onb-actions--right">
        <button class="uw-actions__primary" @click="router.push({ name: 'suggest' })">
          {{ $t('onboarding.start') }}
          <span class="uw-badge">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8 h 10 M 9 4 l 4 4 -4 4"/></svg>
          </span>
        </button>
      </div>
    </template>

    <p v-if="error" class="uw-error">{{ error }}</p>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, h, defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../api/client.js'
import { useTheme } from '../composables/useTheme.js'

const router = useRouter()
const { t } = useI18n()
const { colorScheme: theme } = useTheme()

const step = ref(1)
const error = ref('')

const memoryConsent = ref<boolean>(false) // skipped the explicit question — see README
const setting = ref<'indoor' | 'outdoor' | 'no_preference'>('no_preference')
const social = ref<'alone' | 'with_others' | 'no_preference'>('no_preference')
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

const interestOptions = [
  'Creatief', 'Puzzels & denken', 'Bewegen', 'Natuur',
  'Muziek', 'Koken', 'Lezen', 'Niks doen',
]

function toggleInterest(i: string) {
  interests.value = interests.value.includes(i)
    ? interests.value.filter(x => x !== i)
    : [...interests.value, i]
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
          memory_consent: memoryConsent.value,
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

// Inline single-select menu — Fraunces rows with hairline dividers.
const OnbOptionList = defineComponent({
  props: {
    options: { type: Array as () => Array<{ value: string; label: string }>, required: true },
    modelValue: { type: String, required: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('ul', { class: 'uw-onb-options', role: 'list' },
      props.options.map((opt, i) => h('li', { key: opt.value },
        h('button', {
          class: ['uw-onb-option', { 'is-first': i === 0, 'is-selected': opt.value === props.modelValue }],
          onClick: () => emit('update:modelValue', opt.value),
        }, [
          h('span', opt.label),
          opt.value === props.modelValue
            ? h('svg', { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
                h('polyline', { points: '3 8 6.5 11.5 13 5' }))
            : null,
        ])
      ))
    )
  },
})
</script>

<style scoped>
.uw-onb-progress {
  position: relative;
  display: flex; justify-content: center; gap: 6px;
  padding: 22px 0 0;
}
.uw-onb-dot {
  width: 6px; height: 6px; border-radius: 3px;
  background: var(--uw-chip-bg);
  transition: width 300ms ease, background 300ms ease;
}
.uw-onb-dot.is-active { width: 22px; background: var(--uw-primary); }

.uw-title--welcome { padding-top: 72px; font-size: 32px; max-width: 280px; }

.uw-onb-prompt { padding: 56px 28px 0; display: flex; flex-direction: column; gap: 12px; }
.uw-step-label {
  font-family: var(--uw-font-serif); font-size: 17px; font-weight: 400;
  color: var(--uw-ink-mute);
}
.uw-step-title {
  font-family: var(--uw-font-serif);
  font-size: 28px; line-height: 1.22; font-weight: 400; letter-spacing: -0.4px;
  color: var(--uw-ink); margin: 0;
}
.uw-step-hint { font-size: 13px; color: var(--uw-ink-mute); }

/* Inline option menu (setting / social) */
.uw-onb-options {
  position: absolute; left: 28px; right: 28px; bottom: 56px;
  list-style: none; margin: 0; padding: 0;
  display: flex; flex-direction: column;
}
.uw-onb-option {
  width: 100%;
  padding: 18px 0;
  border: 0;
  border-bottom: 1px solid var(--uw-border-soft);
  background: transparent;
  font-family: var(--uw-font-serif);
  font-size: 20px; font-weight: 400; letter-spacing: -0.2px;
  color: var(--uw-ink);
  cursor: pointer; text-align: left;
  display: flex; align-items: center; justify-content: space-between;
  transition: color 120ms ease;
}
.uw-onb-option.is-first { border-top: 1px solid var(--uw-border-soft); }
.uw-onb-option.is-selected { color: var(--uw-primary); }

/* Interests — tonal chips, selected = primary */
.uw-interests {
  position: relative;
  padding: 20px 22px 0;
  display: flex; flex-wrap: wrap; gap: 8px;
}
.uw-interest {
  padding: 9px 14px; border-radius: 999px;
  background: transparent;
  border: 1px solid var(--uw-border);
  color: var(--uw-ink);
  font-size: 13.5px; font-weight: 500;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}
.uw-interest.is-selected {
  background: var(--uw-primary);
  color: var(--uw-primary-fg);
  border-color: transparent;
}

/* Bottom action rows */
.uw-onb-actions {
  position: absolute; left: 22px; right: 22px; bottom: 48px;
  display: flex; align-items: center; justify-content: space-between;
}
.uw-onb-actions--right { justify-content: flex-end; }

.uw-link {
  border: 0; background: transparent;
  color: var(--uw-ink-mute);
  font-size: 14px; font-weight: 500;
  cursor: pointer; padding: 0;
}

.uw-onb-loading {
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  padding-top: 30%;
}
.uw-error {
  position: absolute; left: 22px; right: 22px; bottom: 110px;
  text-align: center; color: #a33; font-size: 13px;
}
</style>
