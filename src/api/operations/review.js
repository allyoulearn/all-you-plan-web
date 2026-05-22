import { gql } from '@apollo/client/core'

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
