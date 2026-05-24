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

/** Delete a single inbox item. */
export const DELETE_INBOX_ITEM = gql`
  mutation DeleteInboxItem($id: ID!) {
    deleteInboxItem(id: $id)
  }
`

/** Triage a set of inbox items in one round trip. */
export const TRIAGE_INBOX_ITEMS_BULK = gql`
  mutation TriageInboxItemsBulk($ids: [ID!]!) {
    triageInboxItemsBulk(ids: $ids) {
      id
      triaged
    }
  }
`

/** Delete a set of inbox items in one round trip. */
export const DELETE_INBOX_ITEMS_BULK = gql`
  mutation DeleteInboxItemsBulk($ids: [ID!]!) {
    deleteInboxItemsBulk(ids: $ids)
  }
`

/** Convert selected inbox items into tasks (optionally pinning a project and
 *  scheduling a date). Marks the source items triaged on success. */
export const CONVERT_INBOX_ITEMS_TO_TASKS = gql`
  mutation ConvertInboxItemsToTasks($ids: [ID!]!, $projectId: ID, $scheduledDate: String) {
    convertInboxItemsToTasks(ids: $ids, projectId: $projectId, scheduledDate: $scheduledDate) {
      id
    }
  }
`
