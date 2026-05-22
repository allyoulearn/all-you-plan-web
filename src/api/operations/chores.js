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
