/**
 * Mock fixtures for the Household feature.
 *
 * HOUSEHOLD_QUERY selects three top-level fields (household, householdInvitations,
 * householdActivity), but the mock link keys a fixture by the FIRST root field
 * only. So the `household` handler returns the full envelope in one shot.
 *
 * Seeds a realistic ACTIVE household (Sam & Jordan) by default so the screen
 * shows content in mock mode. The mutation handlers mutate this module-level
 * state so an invite/cancel/leave round-trips visibly across a reload.
 *
 * `__typename` is carried on every object so Apollo's InMemoryCache keeps the
 * fields rather than silently stripping a fragment-less selection.
 */

let household = {
  __typename: 'Household',
  id: 'hh1',
  name: 'Sam & Jordan',
  members: [
    {
      __typename: 'HouseholdMember',
      userId: 'mock-user-id-001',
      name: 'Sam',
      initial: 'M',
      joinedAt: '2026-04-04T10:00:00.000Z',
      isYou: true
    },
    {
      __typename: 'HouseholdMember',
      userId: 'u2',
      name: 'Jordan',
      initial: 'A',
      joinedAt: '2026-04-12T09:30:00.000Z',
      isYou: false
    }
  ]
}

let invitations = []

let activity = [
  {
    __typename: 'HouseholdActivity',
    id: 'act1',
    actorName: 'Jordan',
    actorInitial: 'A',
    verb: 'completed',
    subject: 'Take out the recycling',
    at: '2026-06-03T09:48:00.000Z'
  },
  {
    __typename: 'HouseholdActivity',
    id: 'act2',
    actorName: 'Jordan',
    actorInitial: 'A',
    verb: 'added',
    subject: 'Pick up XLR cables to shared inbox',
    at: '2026-06-03T09:22:00.000Z'
  },
  {
    __typename: 'HouseholdActivity',
    id: 'act3',
    actorName: 'Sam',
    actorInitial: 'M',
    verb: 'scheduled',
    subject: 'Studio gear delivery for Fri 08:30',
    at: '2026-06-03T08:00:00.000Z'
  },
  {
    __typename: 'HouseholdActivity',
    id: 'act4',
    actorName: 'Jordan',
    actorInitial: 'A',
    verb: 'joined',
    subject: 'the household',
    at: '2026-04-12T09:30:00.000Z'
  }
]

export const registry = {
  // First root field of HOUSEHOLD_QUERY — returns the whole envelope.
  household: () => ({
    household,
    householdInvitations: invitations,
    householdActivity: activity
  }),
  createHousehold: (variables = {}) => {
    household = {
      __typename: 'Household',
      id: 'hh-new',
      name: variables.name ?? 'New household',
      members: [
        {
          __typename: 'HouseholdMember',
          userId: 'mock-user-id-001',
          name: 'Sam',
          initial: 'M',
          joinedAt: new Date().toISOString(),
          isYou: true
        }
      ]
    }

    activity = []
    return { createHousehold: household }
  },
  inviteToHousehold: (variables = {}) => {
    const now = Date.now()
    const expires = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString()

    const invitation = {
      __typename: 'HouseholdInvitation',
      id: `inv-${now}`,
      email: variables.email ?? 'invitee@example.com',
      status: 'pending',
      sentAt: new Date(now).toISOString(),
      expiresAt: expires,
      invitedBy: 'you'
    }

    invitations = [...invitations, invitation]
    return { inviteToHousehold: invitation }
  },
  cancelHouseholdInvitation: (variables = {}) => {
    invitations = invitations.filter(inv => inv.id !== variables.id)
    return { cancelHouseholdInvitation: true }
  },
  acceptHouseholdInvitation: () => ({
    acceptHouseholdInvitation: household
  }),
  declineHouseholdInvitation: (variables = {}) => {
    invitations = invitations.filter(inv => inv.id !== variables.id)
    return { declineHouseholdInvitation: true }
  },
  leaveHousehold: () => {
    household = null
    invitations = []
    activity = []
    return { leaveHousehold: true }
  },
  removeFromHousehold: (variables = {}) => {
    if (household) {
      household = {
        ...household,
        members: household.members.filter(m => m.userId !== variables.userId)
      }
    }

    return { removeFromHousehold: true }
  }
}
