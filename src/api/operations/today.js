import { gql } from '@apollo/client/core'

export const TODAY_QUERY = gql`
  query Today($date: String) {
    today(date: $date) {
      date
      sunrise
      sunset
      kpis { streak todayDone todayTotal focusMinutes activeProjects }
      tasks {
        id title note scheduledTime done completedAt effortMinutes tag projectId order
      }
    }
  }
`

export const COMPLETE_TASK = gql`
  mutation CompleteTask($id: ID!) {
    completeTask(id: $id) { id done completedAt }
  }
`

export const CREATE_TASK = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) { id }
  }
`

export const RESCHEDULE_TASK = gql`
  mutation RescheduleTask($id: ID!, $scheduledDate: String!, $scheduledTime: String) {
    rescheduleTask(id: $id, scheduledDate: $scheduledDate, scheduledTime: $scheduledTime) { id }
  }
`

export const MOVE_UNFINISHED = gql`
  mutation MoveUnfinished($fromDate: String!) {
    moveUnfinishedToTomorrow(fromDate: $fromDate) { id }
  }
`
