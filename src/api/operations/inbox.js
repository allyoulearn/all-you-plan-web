import { gql } from '@apollo/client/core'

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

export const CREATE_INBOX_ITEM = gql`
  mutation CreateInboxItem($text: String!, $source: String) {
    createInboxItem(text: $text, source: $source) {
      id
    }
  }
`

export const TRIAGE_INBOX_ITEM = gql`
  mutation TriageInboxItem($id: ID!) {
    triageInboxItem(id: $id) {
      id
      triaged
    }
  }
`
