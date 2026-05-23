import { gql } from '@apollo/client/core'

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

export const DELETE_CHORE = gql`
  mutation DeleteChore($id: ID!) {
    deleteChore(id: $id)
  }
`
