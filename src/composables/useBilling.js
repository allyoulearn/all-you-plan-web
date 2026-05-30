/**
 * useBilling — entry points for the Stripe upgrade / manage / Google Calendar
 * connect flows.
 *
 * `startUpgrade(planId)` is the single function every CTA in the app (Wren
 * upgrade chip, Settings → Billing screen, future paywalls) should call. It
 * runs the `createCheckoutSession` GraphQL mutation and redirects the
 * browser to the Stripe-hosted Checkout URL. The legacy 'wren-pro' planId
 * (and any other unknown value) defaults to pro_monthly so older UI code
 * that hasn't been updated keeps working.
 *
 * `openPortal()` runs `createCustomerPortalSession` and redirects to
 * Stripe's hosted portal for managing card / invoices / cancellation.
 *
 * `connectGoogleCalendar()` opens the Google OAuth consent screen in a new
 * tab using the URL the API returns. Pro/Family-only — free users get an
 * UPGRADE_REQUIRED GraphQL error that this function maps to the upgrade CTA
 * so a single click can transition Free → checkout without an extra screen.
 */
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth.store.js'
import { apolloClient } from '@/api/apollo.js'
import { CONNECT_GOOGLE_CALENDAR } from '@/api/operations/calendarConnections.js'
import {
  CREATE_CHECKOUT_SESSION,
  CREATE_CUSTOMER_PORTAL_SESSION
} from '@/api/operations/billing.js'

/**
 * Map a legacy or short-form planId to the API's BillingPlanId enum. The
 * Wren upgrade chip emits `wren-pro` from the cap-hit branch (a pre-Stripe
 * literal); we map it to the monthly Pro plan. New callsites should use
 * `pro_monthly` / `pro_yearly` directly.
 *
 * @param {string} planId
 * @returns {'pro_monthly' | 'pro_yearly'}
 */
function normalizePlanId(planId) {
  if (planId === 'pro_yearly') return 'pro_yearly'
  if (planId === 'pro_monthly') return 'pro_monthly'
  // Legacy / unknown → default to monthly so Wren cap-hit clicks resolve.
  return 'pro_monthly'
}

/**
 * Composable that exposes the billing entry points consumed by every paid-tier
 * CTA in the app. Reads tier state from the auth store and runs Stripe-related
 * GraphQL mutations; does not own any local reactive state.
 *
 * @returns {{ currentTier: () => 'free' | 'pro' | 'family', isPaid: () => boolean, startUpgrade: (planId: string) => Promise<{ok: true} | {ok: false, code: string}>, openPortal: () => Promise<{ok: true} | {ok: false, code: string}>, connectGoogleCalendar: () => Promise<{ok: true} | {ok: false, code: string}> }}
 */
export function useBilling() {
  const authStore = useAuthStore()

  /**
   * Current billing tier. Falls back to 'free' when the user is unauthenticated
   * or the legacy User doc has no subscription subdocument (matches the
   * defensive shape of the API resolver in src/domains/auth/resolvers.ts).
   *
   * @returns {'free' | 'pro' | 'family'}
   */
  function currentTier() {
    const tier = authStore.user?.subscription?.tier
    return tier === 'pro' || tier === 'family' ? tier : 'free'
  }

  /**
   * Returns true when the current user is on a paid tier.
   * @returns {boolean}
   */
  function isPaid() {
    return currentTier() !== 'free'
  }

  /**
   * Kick off a Stripe checkout for the given plan. Calls the
   * `createCheckoutSession` GraphQL mutation, then redirects the browser
   * to the hosted Stripe Checkout URL — Stripe explicitly recommends a
   * same-tab redirect (`window.location.href`) over `window.open` so the
   * user doesn't lose their place.
   *
   * @param {string} planId - Public plan identifier ('pro_monthly',
   *   'pro_yearly', or legacy 'wren-pro' which maps to pro_monthly).
   * @returns {Promise<{ok: true} | {ok: false, code: string}>}
   */
  async function startUpgrade(planId) {
    const normalized = normalizePlanId(planId)

    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_CHECKOUT_SESSION,
        variables: { planId: normalized }
      })

      const url = data?.createCheckoutSession?.url

      if (!url) {
        toast.error('Could not start checkout')
        return { ok: false, code: 'NO_URL' }
      }

      // Same-tab redirect — preserves Stripe's recommended flow and lets
      // the success_url bring the user back to the app.
      window.location.href = url
      return { ok: true }
    } catch (err) {
      const code = err?.graphQLErrors?.[0]?.extensions?.code

      if (code === 'CONFIGURATION_ERROR') {
        toast.error('Billing is not configured yet — please contact support')
        return { ok: false, code }
      }

      toast.error('Could not start checkout')
      return { ok: false, code: code ?? 'UNKNOWN' }
    }
  }

  /**
   * Open the Stripe customer portal so the user can manage card, invoices,
   * and cancel the subscription. Same-tab redirect for parity with the
   * checkout flow.
   *
   * @returns {Promise<{ok: true} | {ok: false, code: string}>}
   */
  async function openPortal() {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_CUSTOMER_PORTAL_SESSION
      })

      const url = data?.createCustomerPortalSession?.url

      if (!url) {
        toast.error('Could not open billing portal')
        return { ok: false, code: 'NO_URL' }
      }

      window.location.href = url
      return { ok: true }
    } catch (err) {
      const code = err?.graphQLErrors?.[0]?.extensions?.code

      if (code === 'NOT_FOUND') {
        // No Stripe customer yet — usually means the user has never
        // checked out. Route them to the upgrade flow instead so the
        // button does something useful.
        toast('Start a subscription first to manage billing')
        return { ok: false, code }
      }

      toast.error('Could not open billing portal')
      return { ok: false, code: code ?? 'UNKNOWN' }
    }
  }

  /**
   * Begin a Google Calendar OAuth flow. Calls the `connectGoogleCalendar`
   * GraphQL mutation, then opens the consent URL Google sends back in a
   * new tab so the user can authorize without losing the settings page.
   *
   * Returns a `{ ok: true }` / `{ ok: false, code }` shape so callers can
   * branch in the UI without parsing GraphQL error structures themselves.
   * Free-tier users hit the server-side tier gate (UPGRADE_REQUIRED), and
   * we automatically redirect them into the upgrade funnel — this means
   * the same "Connect" button can serve both Pro (open consent) and Free
   * (start upgrade) flows without the callsite having to branch first,
   * which avoids a race where the cached tier disagrees with the server.
   */
  async function connectGoogleCalendar() {
    try {
      const { data } = await apolloClient.mutate({ mutation: CONNECT_GOOGLE_CALENDAR })
      const url = data?.connectGoogleCalendar?.authUrl

      if (!url) {
        toast.error('Could not start Google Calendar connection')
        return { ok: false, code: 'NO_URL' }
      }

      // _blank + noopener so a malicious referrer can't reach back into the
      // app context once the user is on accounts.google.com.
      window.open(url, '_blank', 'noopener,noreferrer')
      return { ok: true }
    } catch (err) {
      // GraphQL errors land on `err.graphQLErrors[0].extensions.code`; the
      // Apollo client also fans them out onto `err.message`. Match on
      // extensions first because that's the stable wire format.
      const code = err?.graphQLErrors?.[0]?.extensions?.code

      if (code === 'UPGRADE_REQUIRED') {
        // Transparent upsell — the user clicked "Connect", we surface the
        // Stripe checkout instead of an error toast. This is the highest-
        // intent conversion moment for the calendar feature.
        startUpgrade('wren-pro')
        return { ok: false, code: 'UPGRADE_REQUIRED' }
      }

      if (code === 'CONFIGURATION_ERROR') {
        toast.error('Google Calendar is not configured yet — please contact support')
        return { ok: false, code }
      }

      toast.error('Could not start Google Calendar connection')
      return { ok: false, code: code ?? 'UNKNOWN' }
    }
  }

  return {
    currentTier,
    isPaid,
    startUpgrade,
    openPortal,
    connectGoogleCalendar
  }
}
