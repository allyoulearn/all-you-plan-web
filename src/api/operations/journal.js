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
    $tags: [String]
  ) {
    createJournalEntry(
      date: $date
      prompt: $prompt
      pullQuote: $pullQuote
      body: $body
      tags: $tags
    ) {
      id
    }
  }
`
