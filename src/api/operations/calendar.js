/**
 * GraphQL operations for the calendar view.
 *
 * Queries: CALENDAR_EVENTS_QUERY (events for the given month). The `month`
 * argument is an ISO date string anchoring the month (e.g. "2026-05-01").
 * (WEB-W1-12)
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
    }
  }
`
