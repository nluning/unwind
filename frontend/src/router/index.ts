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
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('../pages/OnboardingPage.vue'),
      // `meta.onboarding` is still read by App.vue to hide the BottomNav
      // and UserMenu chrome on this page. The router guard no longer
      // reads it (onboarding stops being a gate in plan/17). Revisit
      // chrome handling when Phase 3.2 wires this page up as a menu
      // action.
      meta: { onboarding: true },
    },
    {
      path: '/suggest',
      name: 'suggest',
      component: () => import('../pages/SuggestPage.vue'),
    },
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

  // An already-logged-in EMAIL user shouldn't see the login form again
  // — they should log out first. Anonymous users (email === null) pass
  // through because /login also hosts the upgrade flow they reach via
  // the menu's "Maak een account" entry.
  if (to.name === 'login' && user.value?.email) {
    return { name: 'suggest' }
  }

  // A user who explicitly logged out and then reloads has no session
  // and was intentionally NOT re-authed by fetchMe (see useAuth). Send
  // them to /login instead of letting them land on a protected page
  // that will just 401 on every fetch.
  if (!user.value && isExplicitlyLoggedOut() && to.name !== 'login' && to.name !== 'privacy') {
    return { name: 'login' }
  }
})

export default router
