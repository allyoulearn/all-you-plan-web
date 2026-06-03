/**
 * GraphQL operations for the Household feature (two-person shared planning).
 *
 * One query loads the household, its pending invitations, and the recent
 * activity feed in a single round-trip. Mutations cover the full lifecycle:
 * create, invite, cancel/accept/decline an invitation, leave, and remove a
 * member. Ported from the mobile app's operations (see
 * `all-you-plan-mobile/src/api/operations/household.ts`); the web variant also
 * selects the `invitedBy` field exposed by the API.
 */
import { gql } from '@apollo/client/core'

/** Fetch the household, its pending invitations, and the activity feed. */
export const HOUSEHOLD_QUERY = gql`
  query Household {
    household {
      id
      name
      members {
        userId
        name
        initial
        joinedAt
        isYou
      }
    }
    householdInvitations {
      id
      email
      status
      sentAt
      expiresAt
      invitedBy
    }
    householdActivity {
      id
      actorName
      actorInitial
      verb
      subject
      at
    }
  }
`

/** Create a household with the given name; returns the new household. */
export const CREATE_HOUSEHOLD = gql`
  mutation CreateHousehold($name: String!) {
    createHousehold(name: $name) {
      id
      name
      members {
        userId
        name
        initial
        joinedAt
        isYou
      }
    }
  }
`

/** Invite a person by email; returns the new pending invitation. */
export const INVITE_TO_HOUSEHOLD = gql`
  mutation InviteToHousehold($email: String!) {
    inviteToHousehold(email: $email) {
      id
      email
      status
      sentAt
      expiresAt
      invitedBy
    }
  }
`

/** Cancel a pending invitation you sent. */
export const CANCEL_HOUSEHOLD_INVITATION = gql`
  mutation CancelHouseholdInvitation($id: ID!) {
    cancelHouseholdInvitation(id: $id)
  }
`

/** Accept an invitation addressed to you; returns the joined household. */
export const ACCEPT_HOUSEHOLD_INVITATION = gql`
  mutation AcceptHouseholdInvitation($id: ID!) {
    acceptHouseholdInvitation(id: $id) {
      id
      name
      members {
        userId
        name
        initial
        joinedAt
        isYou
      }
    }
  }
`

/** Decline an invitation addressed to you. */
export const DECLINE_HOUSEHOLD_INVITATION = gql`
  mutation DeclineHouseholdInvitation($id: ID!) {
    declineHouseholdInvitation(id: $id)
  }
`

/** Leave the household; your shared items revert to private. */
export const LEAVE_HOUSEHOLD = gql`
  mutation LeaveHousehold {
    leaveHousehold
  }
`

/** Remove another member from the household by their user id. */
export const REMOVE_FROM_HOUSEHOLD = gql`
  mutation RemoveFromHousehold($userId: ID!) {
    removeFromHousehold(userId: $userId)
  }
`
