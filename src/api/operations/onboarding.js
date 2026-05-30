/** GraphQL operations for the onboarding wizard. */
import { gql } from '@apollo/client/core'

const STATE = gql`
  fragment OnboardingStateFields on OnboardingState {
    onboardedAt
    step
    mode
    tone
    seededIds {
      choreId
      projectId
      inboxItemId
    }
  }
`

export const ONBOARDING_STATE_QUERY = gql`
  ${STATE}
  query OnboardingState {
    onboardingState {
      ...OnboardingStateFields
    }
  }
`

export const UPDATE_ONBOARDING = gql`
  ${STATE}
  mutation UpdateOnboarding($input: OnboardingInput!) {
    updateOnboarding(input: $input) {
      ...OnboardingStateFields
    }
  }
`

export const COMPLETE_ONBOARDING = gql`
  ${STATE}
  mutation CompleteOnboarding {
    completeOnboarding {
      ...OnboardingStateFields
    }
  }
`

export const RESTART_ONBOARDING = gql`
  mutation RestartOnboarding {
    restartOnboarding
  }
`
