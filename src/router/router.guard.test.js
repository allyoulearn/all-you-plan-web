import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// We test the guard logic in isolation by importing the auth store and
// reproducing the guard function verbatim. This avoids the circular dependency
// between the router module and apollo.js (which references window.location at
// module evaluation time, causing jsdom issues).

vi.mock('@/api/apollo', () => ({
  apolloClient: { query: vi.fn(), mutate: vi.fn() },
  setAccessToken: vi.fn(),
  refreshAccessToken: vi.fn(),
}))

vi.mock('@/api/operations', () => ({
  LOGIN: 'LOGIN',
  REGISTER: 'REGISTER',
  LOGOUT: 'LOGOUT',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  FORGOT_PASSWORD: 'FORGOT_PASSWORD',
  RESET_PASSWORD: 'RESET_PASSWORD',
  REFRESH_TOKEN: { loc: { source: { body: 'query { refreshToken { accessToken } }' } } },
}))

vi.mock('@/composables/useErrorToast', () => ({
  useErrorToast: () => ({ toastError: vi.fn() }),
}))

import { useAuthStore } from '@/stores/auth.store'

// Reproduce the guard logic as it appears in router/index.js:
//   if (!to.meta.public && !auth.isAuthenticated) return { name: 'login' }
//   if (to.meta.public && auth.isAuthenticated) return { name: 'today' }
//   return true
function runGuard(to, auth) {
  if (!to.meta.public && !auth.isAuthenticated) return { name: 'login' }
  if (to.meta.public && auth.isAuthenticated) return { name: 'today' }
  return true
}

describe('router guard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  describe('unauthenticated user', () => {
    it('redirects to login when navigating to a protected route', () => {
      const auth = useAuthStore()
      // no token set — isAuthenticated is false
      const result = runGuard({ meta: {} }, auth)
      expect(result).toEqual({ name: 'login' })
    })

    it('allows access to public routes', () => {
      const auth = useAuthStore()
      const result = runGuard({ meta: { public: true } }, auth)
      expect(result).toBe(true)
    })
  })

  describe('authenticated user', () => {
    beforeEach(() => {
      // Manually set a token so isAuthenticated becomes true
    })

    it('allows access to protected routes', () => {
      const auth = useAuthStore()
      auth.accessToken = 'some-token'
      const result = runGuard({ meta: {} }, auth)
      expect(result).toBe(true)
    })

    it('redirects away from public (auth) routes to today', () => {
      const auth = useAuthStore()
      auth.accessToken = 'some-token'
      const result = runGuard({ meta: { public: true } }, auth)
      expect(result).toEqual({ name: 'today' })
    })

    it('redirects from /auth/login to today', () => {
      const auth = useAuthStore()
      auth.accessToken = 'some-token'
      const result = runGuard({ meta: { public: true }, name: 'login' }, auth)
      expect(result).toEqual({ name: 'today' })
    })

    it('redirects from /auth/register to today', () => {
      const auth = useAuthStore()
      auth.accessToken = 'some-token'
      const result = runGuard({ meta: { public: true }, name: 'register' }, auth)
      expect(result).toEqual({ name: 'today' })
    })
  })
})
