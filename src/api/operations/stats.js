/**
 * GraphQL operations for the stats feature.
 *
 * Queries: STATS_QUERY (heatmap + ranked-habits envelope). The heatmap is a
 * scalar JSON shape — the view decides how to render it. (WEB-W1-12)
 */
import { gql } from '@apollo/client/core'

/** Fetch all stats needed for the Stats screen in a single request. */
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
