import { gql } from '@apollo/client/core'

export const JOURNAL_ENTRIES_QUERY = gql`
  query JournalEntries {
    journalEntries {
      id
      date
      prompt
      pullQuote
      body
      tags
    }
  }
`

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

export const DELETE_JOURNAL_ENTRY = gql`
  mutation DeleteJournalEntry($id: ID!) {
    deleteJournalEntry(id: $id)
  }
`
