/**
 * GraphQL operations for the inbox (capture + triage flow).
 *
 * Queries: INBOX_ITEMS_QUERY (optionally filtered by triaged flag).
 * Mutations: CREATE_INBOX_ITEM, TRIAGE_INBOX_ITEM. (WEB-W1-12)
 */
import { gql } from '@apollo/client/core'

/** Fetch inbox items; pass `triaged: false` for the untriaged queue. */
export const INBOX_ITEMS_QUERY = gql`
  query InboxItems($triaged: Boolean) {
    inboxItems(triaged: $triaged) {
      id
      text
      source
      triaged
      capturedAt
    }
  }
`

/** Capture a new inbox item from quick text input. */
export const CREATE_INBOX_ITEM = gql`
  mutation CreateInboxItem($text: String!, $source: String) {
    createInboxItem(text: $text, source: $source) {
      id
    }
  }
`

/** Mark an inbox item as triaged (removes it from the untriaged queue). */
export const TRIAGE_INBOX_ITEM = gql`
  mutation TriageInboxItem($id: ID!) {
    triageInboxItem(id: $id) {
      id
      triaged
    }
  }
`
