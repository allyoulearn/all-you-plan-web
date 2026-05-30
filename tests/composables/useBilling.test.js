/**
 * Tests for the `useBilling` composable. Verifies that the new Stripe
 * checkout / portal mutations are called with the expected plan IDs and
 * that the success / error redirects happen via window.location.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// vi.mock factories are hoisted to the top of the file, so any helper
// they reference must be created inside vi.hoisted() (which runs before
// the mocks). Storing mocks on a single hoisted object makes them easy
// to share between mock factories and the test bodies.
const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  toastError: vi.fn(),
  toastDefault: vi.fn(),
  authStore: { user: null }
}))

vi.mock('@/api/apollo.js', () => ({
  apolloClient: { mutate: (...args) => mocks.mutate(...args) }
}))

vi.mock('@/stores/auth.store.js', () => ({
  useAuthStore: () => mocks.authStore
}))

vi.mock('vue-sonner', () => ({
  toast: Object.assign((...args) => mocks.toastDefault(...args), {
    error: (...args) => mocks.toastError(...args)
  })
}))

import { useBilling } from '@/composables/useBilling.js'
import {
  CREATE_CHECKOUT_SESSION,
  CREATE_CUSTOMER_PORTAL_SESSION
} from '@/api/operations/billing.js'

describe('useBilling.startUpgrade', () => {
  let originalLocation

  beforeEach(() => {
    mocks.mutate.mockReset()
    mocks.toastError.mockReset()
    mocks.toastDefault.mockReset()
    // Replace window.location with a writable stub so we can assert the
    // checkout redirect without navigating the jsdom window.
    originalLocation = window.location
    delete window.location
    window.location = { href: '' }
  })

  afterEach(() => {
    window.location = originalLocation
  })

  it('runs CREATE_CHECKOUT_SESSION with the normalized planId', async () => {
    mocks.mutate.mockResolvedValue({
      data: { createCheckoutSession: { url: 'https://checkout.stripe.com/x', sessionId: 'cs_1' } }
    })

    const res = await useBilling().startUpgrade('pro_monthly')
    expect(res.ok).toBe(true)

    expect(mocks.mutate).toHaveBeenCalledWith({
      mutation: CREATE_CHECKOUT_SESSION,
      variables: { planId: 'pro_monthly' }
    })

    expect(window.location.href).toBe('https://checkout.stripe.com/x')
  })

  it('maps the legacy "wren-pro" planId to pro_monthly', async () => {
    mocks.mutate.mockResolvedValue({
      data: { createCheckoutSession: { url: 'https://checkout.stripe.com/x', sessionId: 'cs_1' } }
    })

    await useBilling().startUpgrade('wren-pro')

    expect(mocks.mutate).toHaveBeenCalledWith({
      mutation: CREATE_CHECKOUT_SESSION,
      variables: { planId: 'pro_monthly' }
    })
  })

  it('surfaces a configuration toast on CONFIGURATION_ERROR', async () => {
    mocks.mutate.mockRejectedValue({
      graphQLErrors: [{ extensions: { code: 'CONFIGURATION_ERROR' } }]
    })

    const res = await useBilling().startUpgrade('pro_monthly')
    expect(res).toEqual({ ok: false, code: 'CONFIGURATION_ERROR' })
    expect(mocks.toastError).toHaveBeenCalled()
    expect(window.location.href).toBe('')
  })

  it('returns NO_URL when the mutation returns no url', async () => {
    mocks.mutate.mockResolvedValue({
      data: { createCheckoutSession: { url: null, sessionId: 'x' } }
    })

    const res = await useBilling().startUpgrade('pro_monthly')
    expect(res).toEqual({ ok: false, code: 'NO_URL' })
    expect(mocks.toastError).toHaveBeenCalled()
  })
})

describe('useBilling.openPortal', () => {
  let originalLocation

  beforeEach(() => {
    mocks.mutate.mockReset()
    mocks.toastError.mockReset()
    mocks.toastDefault.mockReset()
    originalLocation = window.location
    delete window.location
    window.location = { href: '' }
  })

  afterEach(() => {
    window.location = originalLocation
  })

  it('runs CREATE_CUSTOMER_PORTAL_SESSION and redirects', async () => {
    mocks.mutate.mockResolvedValue({
      data: { createCustomerPortalSession: { url: 'https://billing.stripe.com/p/x' } }
    })

    const res = await useBilling().openPortal()
    expect(res.ok).toBe(true)

    expect(mocks.mutate).toHaveBeenCalledWith({
      mutation: CREATE_CUSTOMER_PORTAL_SESSION
    })

    expect(window.location.href).toBe('https://billing.stripe.com/p/x')
  })

  it('handles NOT_FOUND (no Stripe customer yet) with a friendly toast', async () => {
    mocks.mutate.mockRejectedValue({
      graphQLErrors: [{ extensions: { code: 'NOT_FOUND' } }]
    })

    const res = await useBilling().openPortal()
    expect(res).toEqual({ ok: false, code: 'NOT_FOUND' })
    expect(mocks.toastDefault).toHaveBeenCalled()
  })
})
