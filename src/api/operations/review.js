/**
 * GraphQL operations for the daily review feature.
 *
 * Queries: DAILY_REVIEW_QUERY (a single date's review record).
 * Mutations: SAVE_DAILY_REVIEW (upsert).
 * Responses are stored as JSON-shaped reflections; the server validates
 * shape.
 */
import { gql } from '@apollo/client/core'

/** Fetch the review record for the given ISO date (null if missing). */
export const DAILY_REVIEW_QUERY = gql`
  query DailyReview($date: String!) {
    dailyReview(date: $date) {
      id
      date
      mood
      responses
    }
  }
`

/** Upsert the daily review for `date` with a mood and a JSON response payload. */
export const SAVE_DAILY_REVIEW = gql`
  mutation SaveDailyReview($date: String!, $mood: String!, $responses: JSON) {
    saveDailyReview(date: $date, mood: $mood, responses: $responses) {
      id
      date
      mood
      responses
    }
  }
`
