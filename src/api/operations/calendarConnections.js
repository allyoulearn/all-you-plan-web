/**
 * GraphQL operations for external calendar connections (Google for now).
 *
 * Lives in its own file rather than the existing `calendar.js` so the
 * Settings → Billing screen can import these without dragging in the
 * monthly events query bundle. Once Outlook / Apple land they'll share
 * this file.
 */
import { gql } from '@apollo/client/core'

/**
 * Begin a Google Calendar OAuth flow. The API returns the consent URL
 * the client should open in a new tab/window. Pro/Family tier required —
 * Free users get an UPGRADE_REQUIRED GraphQL error that the UI swaps for
 * the upgrade CTA.
 */
export const CONNECT_GOOGLE_CALENDAR = gql`
  mutation ConnectGoogleCalendar {
    connectGoogleCalendar {
      authUrl
    }
  }
`

/**
 * Tear down a connection by id. Idempotent on the server — a duplicate
 * disconnect returns true rather than NOT_FOUND.
 */
export const DISCONNECT_GOOGLE_CALENDAR = gql`
  mutation DisconnectGoogleCalendar($id: ID!) {
    disconnectGoogleCalendar(id: $id)
  }
`

/**
 * List the current user's connections. Read-path is NOT tier-gated so
 * Free users who downgrade can still see + disconnect a stale link.
 */
export const MY_CALENDAR_CONNECTIONS = gql`
  query MyCalendarConnections {
    myCalendarConnections {
      id
      provider
      email
      status
      lastSyncedAt
    }
  }
`
