/**
 * GraphQL operations for chores (recurring habits / household tasks).
 *
 * Queries: CHORES_QUERY (full list with cadence + streak metadata).
 * Mutations: COMPLETE_CHORE, CREATE_CHORE, UPDATE_CHORE, DELETE_CHORE.
 * Cadence is modelled as `{ type, daysOfWeek?, interval?, dayOfMonth? }`
 * (see api ChoreCadenceInput).
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
        dueDate
      }
      streak
      bestStreak
      lastCompletedOn
      active
      snoozedUntil
      skipNextDate
      order
      recentCompletions
      createdAt
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

/**
 * Undo today's completion: removes the ChoreCompletion row for today and
 * recomputes streak/lastCompletedOn against the prior completion (if any).
 * Pairs with COMPLETE_CHORE; the checkbox toggles between the two.
 */
export const UNCOMPLETE_CHORE = gql`
  mutation UncompleteChore($id: ID!) {
    uncompleteChore(id: $id) {
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
        dueDate
      }
      streak
      bestStreak
      lastCompletedOn
      active
      order
    }
  }
`

/** Update a chore's title, cadence, active flag, and/or order index. */
export const UPDATE_CHORE = gql`
  mutation UpdateChore(
    $id: ID!
    $title: String
    $cadence: ChoreCadenceInput
    $active: Boolean
    $order: Int
  ) {
    updateChore(id: $id, title: $title, cadence: $cadence, active: $active, order: $order) {
      id
      title
      cadence {
        type
        daysOfWeek
        interval
        dayOfMonth
        dueDate
      }
      active
      order
    }
  }
`

/** Permanently delete a chore (cascades completions server-side). */
export const DELETE_CHORE = gql`
  mutation DeleteChore($id: ID!) {
    deleteChore(id: $id)
  }
`

/** Snooze a chore until the given ISO date/datetime. */
export const SNOOZE_CHORE = gql`
  mutation SnoozeChore($id: ID!, $until: String!) {
    snoozeChore(id: $id, until: $until) {
      id
      snoozedUntil
      skipNextDate
    }
  }
`

/** Skip the chore's next due date once. */
export const SKIP_NEXT_CHORE = gql`
  mutation SkipNextChore($id: ID!) {
    skipNextChore(id: $id) {
      id
      snoozedUntil
      skipNextDate
    }
  }
`

/** Clear snoozedUntil so the chore resumes immediately. */
export const RESUME_CHORE = gql`
  mutation ResumeChore($id: ID!) {
    resumeChore(id: $id) {
      id
      snoozedUntil
      skipNextDate
    }
  }
`
