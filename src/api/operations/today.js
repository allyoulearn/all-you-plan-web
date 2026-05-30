/**
 * GraphQL operations for the daily Today view.
 *
 * Queries: TODAY_QUERY (day envelope: date, sunrise/sunset, KPIs, tasks).
 * Mutations: COMPLETE_TASK, CREATE_TASK, RESCHEDULE_TASK, MOVE_UNFINISHED.
 * COMPLETE_TASK is re-exported as COMPLETE_PROJECT_TASK from projects.js so
 * both stores share the same document node and the Apollo cache stays
 * coherent (, WEB-T05-015).
 */
import { gql } from '@apollo/client/core'

/** Fetch the today envelope for a date (defaults to today server-side). */
export const TODAY_QUERY = gql`
  query Today($date: String) {
    today(date: $date) {
      date
      sunrise
      sunset
      kpis {
        streak
        todayDone
        todayTotal
        focusMinutes
        activeProjects
      }
      tasks {
        id
        title
        note
        scheduledTime
        done
        completedAt
        effortMinutes
        tag
        projectId
        order
      }
    }
  }
`

/** Mark a single task complete; returns the updated done flag and timestamp. */
export const COMPLETE_TASK = gql`
  mutation CompleteTask($id: ID!) {
    completeTask(id: $id) {
      id
      done
      completedAt
    }
  }
`

/** Create a task (today or project); accepts the shared CreateTaskInput. */
export const CREATE_TASK = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
    }
  }
`

/** Move a task to a different date / time slot. */
export const RESCHEDULE_TASK = gql`
  mutation RescheduleTask($id: ID!, $scheduledDate: String!, $scheduledTime: String) {
    rescheduleTask(id: $id, scheduledDate: $scheduledDate, scheduledTime: $scheduledTime) {
      id
    }
  }
`

/** Reschedule every unfinished task on `fromDate` to the next day. */
export const MOVE_UNFINISHED = gql`
  mutation MoveUnfinished($fromDate: String!) {
    moveUnfinishedToTomorrow(fromDate: $fromDate) {
      id
    }
  }
`
