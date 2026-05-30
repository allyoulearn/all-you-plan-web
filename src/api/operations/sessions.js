/** GraphQL operations for active session management. */
import { gql } from '@apollo/client/core'

export const SESSIONS_QUERY = gql`
  query Sessions {
    sessions {
      id
      device
      ipAddress
      city
      lastSeenAt
      current
    }
  }
`

export const REVOKE_SESSION = gql`
  mutation RevokeSession($id: ID!) {
    revokeSession(id: $id)
  }
`

export const REVOKE_OTHER_SESSIONS = gql`
  mutation RevokeOtherSessions {
    revokeOtherSessions
  }
`
