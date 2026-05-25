/**
 * useBilling — entry points for the Stripe upgrade / manage flows.
 *
 * `startUpgrade(planId)` is the single function every CTA in the app (Wren
 * upgrade chip, Settings → Billing screen, future paywalls) should call. The
 * actual Stripe checkout endpoint (`createCheckoutSession`) is a separate
 * workstream tracked under Phase 1 Task 7. Until that ships, this composable
 * surfaces a toast that explains the click was received and logs the planId
 * so the conversion funnel can be measured without a working checkout.
 *
 * Keeping the entry point centralised now means swapping the body for a
 * real apollo mutation is a one-line change with no callsite churn.
 */
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth.store.js'

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
   * Kick off a Stripe checkout for the given plan. Currently a stub — the
   * real mutation `createCheckoutSession(planId)` lands in Task 7. This
   * function intentionally stays pure (no router push, no window.open) so
   * the Stripe URL hand-off lives in one place once the API exists.
   *
   * @param {string} planId - Backend plan identifier (e.g. 'wren-pro')
   */
  function startUpgrade(planId) {
    // Funnel instrumentation — log every click so analytics can compare
    // "CTA shown" (the cap-hit message) vs "CTA clicked" before checkout
    // exists. The actual stream of clicks will become an event mutation.
    // eslint-disable-next-line no-console
    console.log('upgrade clicked', planId)
    toast('Stripe checkout coming soon', {
      description: 'Your interest in Pro has been logged.'
    })
  }

  /**
   * Open the Stripe customer portal so the user can manage card, invoices,
   * and cancel the subscription. Disabled until Task 7 ships.
   */
  function openPortal() {
    // eslint-disable-next-line no-console
    console.log('manage subscription clicked')
    toast('Stripe customer portal coming soon', {
      description: 'You will be able to manage your subscription here.'
    })
  }

  return {
    currentTier,
    isPaid,
    startUpgrade,
    openPortal
  }
}
