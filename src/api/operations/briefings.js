import gql from 'graphql-tag'
import { TASK_FRAGMENT } from './tasks.js'

export const BRIEFING_FRAGMENT = gql`
  ${TASK_FRAGMENT}
  fragment BriefingFields on Briefing {
    id
    date
    greeting
    overdueTasks {
      ...TaskFields
    }
    dueTodayTasks {
      ...TaskFields
    }
    suggestedFocusOrder {
      ...TaskFields
    }
    quadrantShifts {
      task {
        ...TaskFields
      }
      fromQuadrant
      toQuadrant
      reason
    }
    streak {
      current
      best
    }
    nudgeMessage
    generatedAt
  }
`

export const GET_TODAY_BRIEFING = gql`
  ${BRIEFING_FRAGMENT}
  query GetTodayBriefing {
    todayBriefing {
      ...BriefingFields
    }
  }
`

export const GET_BRIEFING = gql`
  ${BRIEFING_FRAGMENT}
  query GetBriefing($date: String!) {
    briefing(date: $date) {
      ...BriefingFields
    }
  }
`

export const GENERATE_BRIEFING = gql`
  ${BRIEFING_FRAGMENT}
  mutation GenerateBriefing {
    generateBriefing {
      ...BriefingFields
    }
  }
`
