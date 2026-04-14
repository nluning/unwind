import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'

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
    {
      path: '/chat',
      name: 'chat',
      component: () => import('../pages/ChatPage.vue'),
    },
  ],
})

// Navigation guard — wait for auth check, then redirect if needed
router.beforeEach(async (to) => {
  const { isLoggedIn, initialize } = useAuth()
  await initialize()

  const isPublic = to.meta.public === true

  if (!isPublic && !isLoggedIn.value) {
    return { name: 'login' }
  }

  if (to.name === 'login' && isLoggedIn.value) {
    return { name: 'suggest' }
  }
})

export default router
