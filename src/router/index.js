import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const routes = [
  {
    path: '/auth',
    component: () => import('@/views/auth/AuthLayout.vue'),
    meta: { layout: 'auth' },
    children: [
      { path: 'login', name: 'Login', component: () => import('@/views/auth/LoginView.vue'), meta: { title: 'Login' } },
      { path: 'register', name: 'Register', component: () => import('@/views/auth/RegisterView.vue'), meta: { title: 'Register' } },
    ],
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: 'Dashboard' },
  },
  {
    path: '/spaces/:id',
    name: 'Space',
    component: () => import('@/views/SpaceView.vue'),
    meta: { title: 'Space' },
  },
  {
    path: '/briefing',
    name: 'Briefing',
    component: () => import('@/views/BriefingView.vue'),
    meta: { title: 'Briefing' },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { title: 'Settings' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition || { top: 0 }
  },
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const isAuthRoute = to.path.startsWith('/auth')

  if (!authStore.isAuthenticated && !isAuthRoute) {
    next({ path: '/auth/login', query: { redirect: to.fullPath } })
    return
  }

  if (authStore.isAuthenticated && isAuthRoute) {
    next('/')
    return
  }

  const title = to.meta.title
  document.title = title ? `${title} | All You Plan` : 'All You Plan'
  next()
})

export default router
