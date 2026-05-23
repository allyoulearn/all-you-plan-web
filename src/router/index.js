/**
 * Application router.
 * Declares all client-side routes and registers two global navigation guards:
 *   - `beforeEach` enforces authentication (redirects unauthenticated users to
 *     login and redirects authenticated users away from public-only routes).
 *   - `afterEach` syncs the document title from `route.meta.title`.
 */
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store.js'
import AppShell from '@/components/layout/AppShell.vue'

// -- Route definitions --

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
        meta: { title: 'Reset password', public: true, allowAuthenticated: true }
      },
      {
        path: 'reset-password',
        name: 'reset-password',
        component: () => import('@/views/auth/ResetPasswordView.vue'),
        meta: { title: 'Reset password', public: true, allowAuthenticated: true }
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

// -- Router instance --

const router = createRouter({
  history: createWebHistory(),
  routes
})

// -- Navigation guards --

// Tracks whether the first attempt to restore a refresh-token session has
// completed. Without this guard, navigating directly to a protected route
// would redirect to /login before tryRestoreSession() had a chance to swap
// the refresh cookie for an in-memory access token (WEB-W2-15).
let restoreAttempted = false
let restorePromise = null

/**
 * Global before-each guard.
 * Redirects unauthenticated users away from protected routes and authenticated
 * users away from public-only routes (e.g. login, register).
 *
 * On the very first navigation it awaits `tryRestoreSession()` so a deep link
 * to a protected route does not flash the login form when the user has a
 * valid refresh-cookie session (WEB-W2-15).
 * @param {import('vue-router').RouteLocationNormalized} to
 * @returns {Promise<boolean|{ name: string }>}
 */
router.beforeEach(async to => {
  const auth = useAuthStore()

  // First-navigation race: try to restore the session before evaluating auth
  // state. Only awaited once per app load — subsequent navigations skip this.
  if (!restoreAttempted && !auth.isAuthenticated) {
    restoreAttempted = true
    restorePromise = auth.tryRestoreSession().catch(() => false)
  }
  if (restorePromise) {
    await restorePromise
    restorePromise = null
  }

  if (!to.meta.public && !auth.isAuthenticated) return { name: 'login' }
  if (to.meta.public && !to.meta.allowAuthenticated && auth.isAuthenticated)
    return { name: 'today' }
  return true
})

/**
 * Global after-each guard.
 * Updates `document.title` from `route.meta.title`.
 * @param {import('vue-router').RouteLocationNormalized} to
 */
router.afterEach(to => {
  document.title = to.meta.title ? `${to.meta.title} — all you plan` : 'all you plan'
})

export { router }
export default router
