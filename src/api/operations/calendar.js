import { gql } from '@apollo/client/core'

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
