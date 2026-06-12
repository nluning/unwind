import { createRouter, createWebHistory } from 'vue-router'
import { useAuth, isExplicitlyLoggedOut } from '../composables/useAuth.js'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/suggest',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../pages/LoginPage.vue'),
      meta: { public: true },
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: () => import('../pages/PrivacyPage.vue'),
      meta: { public: true },
    },
    {
      // ORPHANED by plan 20 §1 — the "Verzin activiteiten voor me" menu entry
      // that linked here is replaced by the three "Jouw activiteiten" add-options.
      // The page is intentionally kept (not deleted): Phase 5's tappable Q&A reuses
      // its pill components (OnboardingOptionPills / OnboardingStepHeader /
      // OnboardingStepActions). Reachable by URL, not by UI.
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('../pages/OnboardingPage.vue'),
      // `meta.onboarding` is still read by App.vue to hide the UserMenu
      // chrome on this page. The router guard no longer reads it
      // (onboarding stops being a gate in plan/17).
      meta: { onboarding: true },
    },
    {
      path: '/suggest',
      name: 'suggest',
      component: () => import('../pages/SuggestPage.vue'),
    },
    // ORPHANED by plan 20 §1 — the other ontdekkingsroutes are dropped from the
    // menu so "Verras me" is the only primary entry. Routes + pages are kept
    // behind a no-UI hook for a future user setting to re-enable them (plan 20
    // §1: "Leave a hook (no UI)... Don't build that setting now"). Reachable by
    // URL, not by UI.
    {
      path: '/stress',
      name: 'stress',
      component: () => import('../pages/StressPage.vue'),
    },
    {
      path: '/counterbalance',
      name: 'counterbalance',
      component: () => import('../pages/CounterbalancePage.vue'),
    },
    {
      path: '/chat',
      name: 'chat',
      component: () => import('../pages/ChatPage.vue'),
    },
    {
      path: '/activities',
      name: 'activities',
      component: () => import('../pages/ActivitiesListPage.vue'),
    },
    // Create + edit are their own routes (not an in-page mode) so navigating
    // between the list and the form is always a real route change — a query
    // param on /activities didn't remount the page. See plan 22 Chunk 4.
    {
      path: '/activities/new',
      name: 'activity-new',
      component: () => import('../pages/ActivityFormPage.vue'),
    },
    {
      path: '/activities/:id/edit',
      name: 'activity-edit',
      component: () => import('../pages/ActivityFormPage.vue'),
    },
    {
      path: '/suggest-from-list',
      name: 'suggest-from-list',
      component: () => import('../pages/SuggestFromListPage.vue'),
    },
    {
      path: '/quick-suggest',
      name: 'quick-suggest',
      component: () => import('../pages/QuickSuggestPage.vue'),
    },
    {
      path: '/account',
      name: 'account',
      component: () => import('../pages/AccountPage.vue'),
    },
  ],
})

// Navigation guard — bootstrap the session, then let pages render.
// initialize() either rehydrates an existing session, creates an
// anonymous device-scoped one for new visitors, or leaves user.value
// null if the server is unreachable (pages render StateError in that
// case). See ADR-012 and plan/17.
router.beforeEach(async (to) => {
  const { user, initialize } = useAuth()
  await initialize()

  if (to.name === 'login' && user.value?.email) {
    return { name: 'suggest' }
  }

  if (!user.value && isExplicitlyLoggedOut() && to.name !== 'login' && to.name !== 'privacy') {
    return { name: 'login' }
  }
})

export default router
