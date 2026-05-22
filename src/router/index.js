import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import AppShell from '@/components/layout/AppShell.vue'

const routes = [
  {
    path: '/auth',
    component: () => import('@/views/auth/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: { title: 'Sign in', public: true }
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('@/views/auth/RegisterView.vue'),
        meta: { title: 'Create account', public: true }
      },
      {
        path: 'forgot-password',
        name: 'forgot-password',
        component: () => import('@/views/auth/ForgotPasswordView.vue'),
        meta: { title: 'Reset password', public: true }
      },
      {
        path: 'reset-password',
        name: 'reset-password',
        component: () => import('@/views/auth/ResetPasswordView.vue'),
        meta: { title: 'Reset password', public: true }
      }
    ]
  },
  {
    path: '/',
    component: AppShell,
    children: [
      {
        path: '',
        name: 'today',
        component: () => import('@/views/TodayView.vue'),
        meta: { title: 'Today', crumbs: ['Workspaces', 'Today'] }
      },
      {
        path: 'chores',
        name: 'chores',
        component: () => import('@/views/ChoresView.vue'),
        meta: { title: 'Chores', crumbs: ['Workspaces', 'Chores'] }
      },
      {
        path: 'projects',
        name: 'projects',
        component: () => import('@/views/ProjectsView.vue'),
        meta: { title: 'Projects', crumbs: ['Workspaces', 'Projects'] }
      },
      {
        path: 'projects/:id',
        name: 'project',
        component: () => import('@/views/ProjectDetailView.vue'),
        meta: { title: 'Project', crumbs: ['Workspaces', 'Projects'] }
      },
      {
        path: 'projects/:id/board',
        name: 'kanban',
        component: () => import('@/views/KanbanView.vue'),
        meta: { title: 'Board', crumbs: ['Workspaces', 'Projects', 'Board'] }
      },
      {
        path: 'calendar',
        name: 'calendar',
        component: () => import('@/views/CalendarView.vue'),
        meta: { title: 'Calendar', crumbs: ['Looking back', 'Calendar'] }
      },
      {
        path: 'stats',
        name: 'stats',
        component: () => import('@/views/StatsView.vue'),
        meta: { title: 'Stats', crumbs: ['Looking back', 'Stats'] }
      },
      {
        path: 'journal',
        name: 'journal',
        component: () => import('@/views/JournalView.vue'),
        meta: { title: 'Journal', crumbs: ['Looking back', 'Journal'] }
      },
      {
        path: 'inbox',
        name: 'inbox',
        component: () => import('@/views/InboxView.vue'),
        meta: { title: 'Inbox', crumbs: ['Looking back', 'Inbox'] }
      },
      {
        path: 'wren',
        name: 'wren',
        component: () => import('@/views/WrenView.vue'),
        meta: { title: 'Wren', crumbs: ['With Wren', 'Chat'] }
      },
      {
        path: 'review',
        name: 'review',
        component: () => import('@/views/ReviewView.vue'),
        meta: { title: 'Daily review', crumbs: ['With Wren', 'Daily review'] }
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/views/SettingsView.vue'),
        meta: { title: 'Settings', crumbs: ['System', 'Settings'] }
      }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(to => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isAuthenticated) return { name: 'login' }
  if (to.meta.public && auth.isAuthenticated) return { name: 'today' }
  return true
})

router.afterEach(to => {
  document.title = to.meta.title ? `${to.meta.title} — all you plan` : 'all you plan'
})

export { router }
export default router
