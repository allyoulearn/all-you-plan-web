/**
 * Mock fixtures for Stripe billing mutations.
 *
 * Both mutations return a hosted URL the client redirects to. Pointing at a
 * dev-only stub keeps the upgrade and customer-portal flows from accidentally
 * navigating to live Stripe in mock mode.
 */

export const registry = {
  createCheckoutSession: (variables = {}) => ({
    createCheckoutSession: {
      url: `https://example.com/mock-checkout?plan=${variables.planId ?? 'pro_monthly'}`,
      sessionId: `cs_mock_${Date.now()}`
    }
  }),
  createCustomerPortalSession: () => ({
    createCustomerPortalSession: {
      url: 'https://example.com/mock-customer-portal'
    }
  })
}
