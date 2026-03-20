import { createRouter, createWebHistory } from 'vue-router'

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
  ],
})

// Navigation guard — redirect to login if not authenticated
router.beforeEach((to) => {
  const isPublic = to.meta.public === true

  // For now, check if we have a user in localStorage as a simple flag.
  // This will be replaced by the auth composable in Step 3.
  const isLoggedIn = localStorage.getItem('unwind-user') !== null

  if (!isPublic && !isLoggedIn) {
    return { name: 'login' }
  }

  if (to.name === 'login' && isLoggedIn) {
    return { name: 'suggest' }
  }
})

export default router
