/**
 * Mock fixtures for the onboarding wizard.
 *
 * All onboarding operations spread a `... OnboardingStateFields on
 * OnboardingState` fragment, so the response must carry __typename or Apollo
 * will drop every fragment field.
 */

const state = {
  __typename: 'OnboardingState',
  onboardedAt: null,
  step: 1,
  mode: null,
  tone: 'warm',
  seededIds: null
}

/** Clone the mutable state with __typename preserved on the snapshot. */
function snapshot() {
  return { ...state }
}

export const registry = {
  onboardingState: () => ({ onboardingState: snapshot() }),
  updateOnboarding: (variables = {}) => {
    Object.assign(state, variables.input ?? {})
    return { updateOnboarding: snapshot() }
  },
  completeOnboarding: () => {
    state.onboardedAt = new Date().toISOString()
    state.step = 6

    state.seededIds = {
      __typename: 'SeededContent',
      choreId: 'seed-chore',
      projectId: 'seed-project',
      inboxItemId: 'seed-inbox'
    }

    return { completeOnboarding: snapshot() }
  },
  restartOnboarding: () => {
    state.onboardedAt = null
    state.step = 1
    return { restartOnboarding: true }
  }
}
