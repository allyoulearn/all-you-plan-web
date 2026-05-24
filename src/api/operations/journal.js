/**
 * GraphQL operations for the journal feature.
 *
 * Queries: JOURNAL_ENTRIES_QUERY (full history).
 * Mutations: CREATE_JOURNAL_ENTRY, UPDATE_JOURNAL_ENTRY, DELETE_JOURNAL_ENTRY.
 * (WEB-W1-12)
 */
import { gql } from '@apollo/client/core'

/**
 * Fetch journal entries (most recent first server-side). Optional `tag`
 * filters server-side to entries that include the tag. `limit` and `before`
 * cap pagination; defaults match the API's own defaults.
 */
export const JOURNAL_ENTRIES_QUERY = gql`
  query JournalEntries($limit: Int, $before: String, $tag: String) {
    journalEntries(limit: $limit, before: $before, tag: $tag) {
      id
      date
      prompt
      pullQuote
      body
      tags
    }
  }
`

/** Persist a new journal entry from a date, optional prompt + pull quote, and body. */
export const CREATE_JOURNAL_ENTRY = gql`
  mutation CreateJournalEntry(
    $date: String!
    $prompt: String
    $pullQuote: String
    $body: String!
    $tags: [String!]
  ) {
    createJournalEntry(
      date: $date
      prompt: $prompt
      pullQuote: $pullQuote
      body: $body
      tags: $tags
    ) {
      id
      date
      prompt
      pullQuote
      body
      tags
    }
  }
`

/** Edit pull quote, body, and/or tags on an existing journal entry. */
export const UPDATE_JOURNAL_ENTRY = gql`
  mutation UpdateJournalEntry($id: ID!, $pullQuote: String, $body: String, $tags: [String!]) {
    updateJournalEntry(id: $id, pullQuote: $pullQuote, body: $body, tags: $tags) {
      id
      pullQuote
      body
      tags
    }
  }
`

/** Permanently delete a journal entry. */
export const DELETE_JOURNAL_ENTRY = gql`
  mutation DeleteJournalEntry($id: ID!) {
    deleteJournalEntry(id: $id)
  }
`
