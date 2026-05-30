/**
 * GraphQL operations for the calendar view.
 *
 * Queries: CALENDAR_EVENTS_QUERY (events for the given month). The `month`
 * argument is an ISO date string anchoring the month (e.g. "2026-05-01").
 *
 */
import { gql } from '@apollo/client/core'

/** Fetch all calendar events for the month containing `month`. */
export const CALENDAR_EVENTS_QUERY = gql`
  query CalendarEvents($month: String) {
    calendarEvents(month: $month) {
      id
      title
      date
      accent
      allDay
      startTime
      endTime
      location
      notes
    }
  }
`

/** Update a calendar event's title, date, accent, time, location, or notes.
 *  Used by drag-to-reschedule on the monthly grid (date only) and by the
 *  event edit modal (everything else). */
export const UPDATE_CALENDAR_EVENT = gql`
  mutation UpdateCalendarEvent(
    $id: ID!
    $title: String
    $date: String
    $accent: Boolean
    $allDay: Boolean
    $startTime: String
    $endTime: String
    $location: String
    $notes: String
  ) {
    updateCalendarEvent(
      id: $id
      title: $title
      date: $date
      accent: $accent
      allDay: $allDay
      startTime: $startTime
      endTime: $endTime
      location: $location
      notes: $notes
    ) {
      id
      title
      date
      accent
      allDay
      startTime
      endTime
      location
      notes
    }
  }
`

/** Create a calendar event from the day-tap or new-event sheet. */
export const CREATE_CALENDAR_EVENT = gql`
  mutation CreateCalendarEvent(
    $title: String!
    $date: String!
    $accent: Boolean
    $allDay: Boolean
    $startTime: String
    $endTime: String
    $location: String
    $notes: String
  ) {
    createCalendarEvent(
      title: $title
      date: $date
      accent: $accent
      allDay: $allDay
      startTime: $startTime
      endTime: $endTime
      location: $location
      notes: $notes
    ) {
      id
      title
      date
      accent
      allDay
      startTime
      endTime
      location
      notes
    }
  }
`

/** Remove a calendar event. */
export const DELETE_CALENDAR_EVENT = gql`
  mutation DeleteCalendarEvent($id: ID!) {
    deleteCalendarEvent(id: $id)
  }
`

/**
 * Atomically set a task's scheduledDate, scheduledTime, and effortMinutes —
 * used by the week-view drag-to-slot flow. Returns the updated task fields so
 * the optimistic block can be reconciled with server truth.
 */
export const MOVE_TASK_TO_TIME_SLOT = gql`
  mutation MoveTaskToTimeSlot(
    $id: ID!
    $scheduledDate: String!
    $scheduledTime: String!
    $effortMinutes: Int
  ) {
    moveTaskToTimeSlot(
      id: $id
      scheduledDate: $scheduledDate
      scheduledTime: $scheduledTime
      effortMinutes: $effortMinutes
    ) {
      id
      scheduledDate
      scheduledTime
      effortMinutes
    }
  }
`
