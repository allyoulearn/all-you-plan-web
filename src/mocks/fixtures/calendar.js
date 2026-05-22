/** Mock fixtures for the Calendar screen. */

const calendarEvents = [
  { id: 'ev1', title: 'Team standup', date: '2026-05-22', accent: 'blue' },
  { id: 'ev2', title: 'Dentist appointment', date: '2026-05-22', accent: 'red' },
  { id: 'ev3', title: 'Lunch with Sarah', date: '2026-05-23', accent: 'green' },
  { id: 'ev4', title: 'Product review', date: '2026-05-26', accent: 'blue' },
  { id: 'ev5', title: 'Gym session', date: '2026-05-27', accent: 'orange' },
  { id: 'ev6', title: 'Coffee with mentor', date: '2026-05-28', accent: 'purple' },
  { id: 'ev7', title: 'End-of-month retrospective', date: '2026-05-29', accent: 'blue' },
  { id: 'ev8', title: 'Family dinner', date: '2026-05-30', accent: 'green' }
]

export const registry = {
  calendarEvents: () => ({ calendarEvents })
}
