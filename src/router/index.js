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
    path: '/onboarding',
    name: 'onboarding',
    component: () => import('@/views/OnboardingView.vue'),
    meta: { title: 'Welcome', allowOnboarding: true }
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
        path: 'goals',
        name: 'goals',
        component: () => import('@/views/GoalsView.vue'),
        meta: { title: 'Goals', crumbs: ['Workspaces', 'Goals'] }
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
        // fullWidth lets the board escape the shell's 980px content cap so
        // additional columns get real estate instead of being squeezed into
        // a reading-width gutter.
        meta: { title: 'Board', crumbs: ['Workspaces', 'Projects', 'Board'], fullWidth: true }
      },
      {
        path: 'calendar',
        name: 'calendar',
        component: () => import('@/views/CalendarView.vue'),
        // fullWidth lets the week view confine itself to the viewport so the
        // hour grid scrolls internally instead of pushing the whole page.
        meta: { title: 'Calendar', crumbs: ['Looking back', 'Calendar'], fullWidth: true }
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
        // fullWidth makes the content cell a flex column so the wren-view's
        // messages container can be a real scroller (instead of expanding to
        // its content and pushing the whole page into scroll). Without this,
        // the conversation cannot "start at the bottom" — there is no bottom.
        meta: { title: 'Wren', crumbs: ['With Wren', 'Chat'], fullWidth: true }
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
      },
      {
        path: 'settings/notifications',
        name: 'notifications',
        component: () => import('@/views/NotificationsView.vue'),
        meta: { title: 'Notifications', crumbs: ['System', 'Settings', 'Notifications'] }
      },
      {
        path: 'billing/success',
        name: 'billing-success',
        component: () => import('@/views/BillingSuccessView.vue'),
        meta: { title: 'Welcome to Pro', crumbs: ['System', 'Billing'] }
      },
      {
        path: 'billing/cancel',
        name: 'billing-cancel',
        component: () => import('@/views/BillingCancelView.vue'),
        meta: { title: 'Checkout canceled', crumbs: ['System', 'Billing'] }
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
// the refresh cookie for an in-memory access token.
let restoreAttempted = false
let restorePromise = null

/**
 * Global before-each guard.
 * Redirects unauthenticated users away from protected routes and authenticated
 * users away from public-only routes (e.g. login, register).
 *
 * On the very first navigation it awaits `tryRestoreSession()` so a deep link
 * to a protected route does not flash the login form when the user has a
 * valid refresh-cookie session.
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

  // Push first-run users into onboarding. The onboarding route itself is
  // marked allowOnboarding so we don't redirect-loop while they're inside it.
  if (
    auth.isAuthenticated &&
    !to.meta.allowOnboarding &&
    auth.user &&
    auth.user.onboardedAt === null
  ) {
    return { name: 'onboarding' }
  }

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
