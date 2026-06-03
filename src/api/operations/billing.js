/**
 * GraphQL operations for Stripe billing.
 *
 * - createCheckoutSession(planId) — start a hosted Stripe Checkout
 * - createCustomerPortalSession   — open the Stripe Customer Portal
 *
 * Both mutations return a hosted URL the client must redirect to.
 * Plan IDs match the API's BillingPlanId enum (pro_monthly / pro_yearly).
 */
import { gql } from '@apollo/client/core'

export const CREATE_CHECKOUT_SESSION = gql`
  mutation CreateCheckoutSession($planId: BillingPlanId!) {
    createCheckoutSession(planId: $planId) {
      url
      sessionId
    }
  }
`

export const CREATE_CUSTOMER_PORTAL_SESSION = gql`
  mutation CreateCustomerPortalSession {
    createCustomerPortalSession {
      url
    }
  }
`

/**
 * Swap an active subscription to a different plan (Phase 4 Item A).
 * Server uses Stripe prorations so the user is credited the unused portion
 * of the current cycle. The User doc updates asynchronously via the
 * subscription.updated webhook — the returned snapshot may briefly lag.
 */
export const CHANGE_SUBSCRIPTION_TIER = gql`
  mutation ChangeSubscriptionTier($planId: BillingPlanId!) {
    changeSubscriptionTier(planId: $planId) {
      tier
      stripeSubscriptionId
      currentPeriodEnd
      status
    }
  }
`
