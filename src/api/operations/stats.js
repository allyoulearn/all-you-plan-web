import { gql } from '@apollo/client/core'

export const STATS_QUERY = gql`
  query Stats {
    stats {
      heatmap
      rankedHabits {
        choreId
        name
        streak
        bestStreak
      }
    }
  }
`
