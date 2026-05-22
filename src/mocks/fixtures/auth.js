/**
 * Auth fixture registry.
 * Provides mock data for authentication-related GraphQL operations.
 */

const mockUser = {
  id: 'mock-user-id-001',
  email: 'dev@example.com',
  name: 'Dev Tester',
  timezone: 'America/New_York',
  streak: {
    current: 7,
    best: 21,
    lastCompletionDate: '2026-05-21'
  },
  settings: {
    theme: 'system',
    mode: 'standard',
    density: 'comfortable',
    coachPersonality: 'encouraging',
    checkIns: true,
    stalledNudgeDays: 3,
    journalVisibility: 'private'
  }
}

const mockAuthPayload = {
  accessToken: 'mock-access-token',
  user: mockUser
}

export const registry = {
  login: () => ({ login: mockAuthPayload }),
  register: () => ({ register: mockAuthPayload }),
  refreshToken: () => ({ refreshToken: mockAuthPayload }),
  resetPassword: () => ({ resetPassword: mockAuthPayload }),
  me: () => ({ me: mockUser }),
  updateProfile: variables => ({
    updateProfile: { ...mockUser, ...(variables.name ? { name: variables.name } : {}) }
  }),
  logout: () => ({ logout: true }),
  forgotPassword: () => ({ forgotPassword: true })
}
