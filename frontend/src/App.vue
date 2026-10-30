<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import UserMenu from './components/UserMenu.vue'
import HomeButton from './components/HomeButton.vue'
import MenuHintTooltip from './components/MenuHintTooltip.vue'
import FeedbackInterstitial from './components/FeedbackInterstitial.vue'
import { useWelcome } from './composables/useWelcome.js'
import { useAuth } from './composables/useAuth.js'
import { usePostActivityFeedback, type FeedbackOutcome } from './composables/usePostActivityFeedback.js'
import { useFeedbackOnResume } from './composables/useFeedbackOnResume.js'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const { isWelcomed, showMenuHint } = useWelcome()
const { target, answer, dismiss } = usePostActivityFeedback()
const showChrome = computed(
  () =>
    route.meta.public !== true &&
    isWelcomed.value
)
const showHome = computed(
  () => showChrome.value && route.name !== 'suggest' && route.name !== 'chat'
)

// Answering ends the activity: go back to the start. (Already there? Then the
// suggestion flow itself moves on from the 'tot zo' confirmation.) Skipping the
// question just closes it and leaves the user where they are.
function handleAnswer(outcome: FeedbackOutcome) {
  answer(outcome)
  if (route.name !== 'suggest') router.push({ name: 'suggest' })
}

// Only ask once there is a session, and never on login/privacy/onboarding.
useFeedbackOnResume(
  () => !!user.value && route.meta.public !== true && route.meta.onboarding !== true
)
</script>

<template>
  <div>
    <RouterView />
    <UserMenu v-if="showChrome" />
    <HomeButton v-if="showHome" />
    <MenuHintTooltip v-if="showChrome && showMenuHint" />
    <FeedbackInterstitial
      v-if="target"
      :activity="target.activity"
      @answer="handleAnswer"
      @dismiss="dismiss"
    />
  </div>
</template>
