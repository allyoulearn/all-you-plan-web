/**
 * CRIT-4 regression — Apollo cache must be cleared on logout / clearAuth.
 *
 * Before this fix, clearAuth() wiped only the in-memory token, the persisted
 * user object, and the Wren store. The Apollo cache survived, so the next
 * page load on the same browser repainted the previous user's cached data
 * (projects, journal, inbox, householdMembers, wrenMessages, me) before the
 * network revalidation kicked in. The fix is a `apolloClient.clearStore()`
 * call (swallowing the rejection it can throw on in-flight queries) inside
 * `clearAuth`.
 *
 * This file pins down ONLY that contract. The bulk of auth.store coverage
 * lives in tests/stores/auth.store.test.js — these tests deliberately stand
 * alone so a refactor of that file cannot quietly drop the assertion.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { flushPromises } from '@vue/test-utils'

vi.mock('@/api/apollo', () => ({
  apolloClient: {
    mutate: vi.fn(),
    // The fix path catches rejections — we want to be able to reject this
    // and still see clearAuth() complete its synchronous wipes.
    clearStore: vi.fn().mockResolvedValue(undefined)
  },
  setAccessToken: vi.fn(),
  refreshAccessToken: vi.fn()
}))

vi.mock('@/api/operations', () => ({
  LOGIN: 'LOGIN',
  REGISTER: 'REGISTER',
  LOGOUT: 'LOGOUT',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  FORGOT_PASSWORD: 'FORGOT_PASSWORD',
  RESET_PASSWORD: 'RESET_PASSWORD'
}))

vi.mock('@/composables/useErrorToast', () => ({
  useErrorToast: () => ({ toastError: vi.fn(), toastSuccess: vi.fn() })
}))

import { useAuthStore } from '@/stores/auth.store'
import { apolloClient } from '@/api/apollo'

const fakeUser = { id: 'u1', name: 'Ada', email: 'ada@example.com' }
const fakeToken = 'fake-jwt-token'

describe('CRIT-4: clearAuth() clears the Apollo cache', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('calls apolloClient.clearStore() exactly once on clearAuth()', () => {
    const store = useAuthStore()
    store.setAuth({ accessToken: fakeToken, user: fakeUser })
    store.clearAuth()
    expect(apolloClient.clearStore).toHaveBeenCalledTimes(1)
  })

  it('still wipes local state even when clearStore() rejects', async () => {
    apolloClient.clearStore.mockRejectedValueOnce(new Error('in-flight query aborted'))
    const store = useAuthStore()
    store.setAuth({ accessToken: fakeToken, user: fakeUser })
    expect(store.isAuthenticated).toBe(true)

    store.clearAuth()
    // Synchronous wipes happen regardless of clearStore() outcome.
    expect(store.user).toBeNull()
    expect(store.accessToken).toBeNull()
    expect(localStorage.getItem('ayp_user')).toBeNull()

    // Wait for the rejected promise to resolve so the rejection handler runs.
    await flushPromises()
    // clearStore must still have been called even though it threw.
    expect(apolloClient.clearStore).toHaveBeenCalledTimes(1)
  })

  it('logout() funnels through clearAuth() and therefore also clears the cache', async () => {
    apolloClient.mutate.mockResolvedValueOnce({ data: { logout: true } })
    const store = useAuthStore()
    store.setAuth({ accessToken: fakeToken, user: fakeUser })
    await store.logout()
    expect(apolloClient.clearStore).toHaveBeenCalledTimes(1)
  })

  it('logout() clears the cache even when the server-side mutation fails', async () => {
    apolloClient.mutate.mockRejectedValueOnce(new Error('network blip'))
    const store = useAuthStore()
    store.setAuth({ accessToken: fakeToken, user: fakeUser })
    await store.logout()
    // The whole point of local logout: even if the server roundtrip fails, the
    // cache is wiped so the next paint never shows the previous user's data.
    expect(apolloClient.clearStore).toHaveBeenCalledTimes(1)
    expect(store.user).toBeNull()
  })
})
