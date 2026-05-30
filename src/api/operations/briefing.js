/** GraphQL operations for the Today briefing card (Wren AM digest). */
import { gql } from '@apollo/client/core'

/** Fetch today's briefing; cached for the day until manual refresh. */
export const TODAY_BRIEFING_QUERY = gql`
  query TodayBriefing($force: Boolean) {
    todayBriefing(force: $force) {
      state
      greeting
      tone
      generatedAt
      expiresAt
      actions {
        id
        label
        kind
        targetType
        targetId
      }
    }
  }
`

/** Force a refresh; counts against the Wren daily turn cap. */
export const REGENERATE_TODAY_BRIEFING = gql`
  mutation RegenerateTodayBriefing {
    regenerateTodayBriefing {
      state
      greeting
      tone
      generatedAt
      expiresAt
      actions {
        id
        label
        kind
        targetType
        targetId
      }
    }
  }
`
