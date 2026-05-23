/**
 * GraphQL operations for chores (recurring habits / household tasks).
 *
 * Queries: CHORES_QUERY (full list with cadence + streak metadata).
 * Mutations: COMPLETE_CHORE, CREATE_CHORE, UPDATE_CHORE, DELETE_CHORE.
 * Cadence is modelled as `{ type, daysOfWeek?, interval?, dayOfMonth? }`
 * (see api ChoreCadenceInput). (WEB-W1-12)
 */
import { gql } from '@apollo/client/core'

/** Fetch every chore with its cadence and streak counters. */
export const CHORES_QUERY = gql`
  query Chores {
    chores {
      id
      title
      cadence {
        type
        daysOfWeek
        interval
        dayOfMonth
      }
      streak
      bestStreak
      lastCompletedOn
      active
      order
    }
  }
`

/** Log a completion for the given chore; returns updated streak data. */
export const COMPLETE_CHORE = gql`
  mutation CompleteChore($id: ID!) {
    completeChore(id: $id) {
      id
      streak
      bestStreak
      lastCompletedOn
    }
  }
`

/** Create a new chore from a title and cadence definition. */
export const CREATE_CHORE = gql`
  mutation CreateChore($title: String!, $cadence: ChoreCadenceInput!) {
    createChore(title: $title, cadence: $cadence) {
      id
      title
      cadence {
        type
        daysOfWeek
        interval
        dayOfMonth
      }
      streak
      bestStreak
      lastCompletedOn
      active
      order
    }
  }
`

/** Update a chore's title, cadence, and/or active flag. */
export const UPDATE_CHORE = gql`
  mutation UpdateChore($id: ID!, $title: String, $cadence: ChoreCadenceInput, $active: Boolean) {
    updateChore(id: $id, title: $title, cadence: $cadence, active: $active) {
      id
      title
      cadence {
        type
        daysOfWeek
        interval
        dayOfMonth
      }
      active
    }
  }
`

/** Permanently delete a chore (cascades completions server-side). */
export const DELETE_CHORE = gql`
  mutation DeleteChore($id: ID!) {
    deleteChore(id: $id)
  }
`
