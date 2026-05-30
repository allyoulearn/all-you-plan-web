/**
 * Auth fixture registry.
 * Provides mock data for authentication-related GraphQL operations.
 *
 * Every auth operation pulls in `... UserFields on User`. Apollo's
 * InMemoryCache only applies a named fragment when the response object's
 * `__typename` matches the fragment's type condition, so omitting __typename
 * here would silently strip every User field — currently masked in dev only
 * because the auth store rehydrates from localStorage, but a fresh login in
 * mock mode would leave the store with `{}`. Nested types carry their
 * typename too for cache consistency, and `subscription` is included to match
 * the fragment selection (was previously absent from the fixture).
 */

const mockUser = {
  __typename: 'User',
  id: 'mock-user-id-001',
  email: 'dev@example.com',
  name: 'Mara',
  timezone: 'Europe/Helsinki',
  // MVP additions for onboarding / Wren tone / household scoping.
  // `onboardedAt` is set so the router does not loop the demo user into the
  // wizard on every login. Toggle to null to walk through onboarding.
  onboardedAt: '2026-04-01T09:00:00Z',
  wrenTone: 'warm',
  onboardingMode: 'solo',
  householdId: null,
  streak: {
    __typename: 'StreakInfo',
    current: 42,
    best: 60,
    lastCompletionDate: '2026-05-23'
  },
  settings: {
    __typename: 'UserSettings',
    theme: 'warm',
    mode: 'light',
    density: 'normal',
    coachPersonality: 'gentle',
    checkIns: ['morning', 'evening'],
    stalledNudgeDays: 7,
    journalVisibility: 'private'
  },
  subscription: {
    __typename: 'UserSubscription',
    tier: 'free',
    currentPeriodEnd: null,
    status: null
  }
}

const mockAuthPayload = {
  __typename: 'AuthPayload',
  accessToken: 'mock-access-token',
  user: mockUser
}

export const registry = {
  login: () => ({ login: mockAuthPayload }),
  register: () => ({ register: mockAuthPayload }),
  refreshToken: () => ({ refreshToken: mockAuthPayload }),
  resetPassword: () => ({ resetPassword: mockAuthPayload }),
  me: () => ({ me: mockUser }),
  updateProfile: variables => {
    // Mutate the shared mockUser so subsequent reads (e.g. another updateSettings
    // call, or a `me` refresh) reflect the latest values. Without this the UI
    // appears to "snap back" because the response is identical to the cached
    // user. Deep-clone the returned object so Apollo's InMemoryCache treats it
    // as a fresh write rather than merging by identity.
    if (variables.name !== undefined) mockUser.name = variables.name
    if (variables.timezone !== undefined) mockUser.timezone = variables.timezone
    if (variables.wrenTone !== undefined) mockUser.wrenTone = variables.wrenTone
    if (variables.settings) Object.assign(mockUser.settings, variables.settings)
    return {
      updateProfile: {
        ...mockUser,
        settings: { ...mockUser.settings },
        streak: { ...mockUser.streak },
        subscription: { ...mockUser.subscription }
      }
    }
  },
  logout: () => ({ logout: true }),
  forgotPassword: () => ({ forgotPassword: true })
}
