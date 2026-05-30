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
