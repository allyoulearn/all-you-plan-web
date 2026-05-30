/** Mock fixtures for the Calendar screen. */

let calendarEvents = [
  {
    id: 'ev1',
    title: 'Team standup',
    date: '2026-05-22',
    accent: 'blue',
    allDay: false,
    startTime: '09:30',
    endTime: '09:50',
    location: 'Office — meeting room 2',
    notes: 'Sprint update + blockers.'
  },
  {
    id: 'ev2',
    title: 'Dentist appointment',
    date: '2026-05-22',
    accent: 'red',
    allDay: false,
    startTime: '15:00',
    endTime: '16:00',
    location: 'Dr. Adams · 14 Bleecker St.',
    notes: null
  },
  {
    id: 'ev3',
    title: 'Lunch with Sarah',
    date: '2026-05-23',
    accent: 'green',
    allDay: false,
    startTime: '13:00',
    endTime: '14:30',
    location: 'Café Loro',
    notes: null
  },
  {
    id: 'ev4',
    title: 'Product review',
    date: '2026-05-26',
    accent: 'blue',
    allDay: false,
    startTime: '11:00',
    endTime: '12:00',
    location: null,
    notes: 'Bring the latest mocks.'
  },
  {
    id: 'ev5',
    title: 'Gym session',
    date: '2026-05-27',
    accent: 'orange',
    allDay: false,
    startTime: '07:00',
    endTime: '08:00',
    location: 'Equinox',
    notes: null
  },
  {
    id: 'ev6',
    title: 'Coffee with mentor',
    date: '2026-05-28',
    accent: 'purple',
    allDay: false,
    startTime: '10:00',
    endTime: '11:00',
    location: null,
    notes: null
  },
  {
    id: 'ev7',
    title: 'End-of-month retrospective',
    date: '2026-05-29',
    accent: 'blue',
    allDay: false,
    startTime: '16:00',
    endTime: '17:30',
    location: null,
    notes: 'What went well · what didn’t · what to try.'
  },
  {
    id: 'ev8',
    title: 'Family dinner',
    date: '2026-05-30',
    accent: 'green',
    allDay: true,
    startTime: null,
    endTime: null,
    location: 'Mom & Dad’s',
    notes: null
  }
]

let nextEventCounter = calendarEvents.length

export const registry = {
  calendarEvents: () => ({ calendarEvents }),
  createCalendarEvent: (variables = {}) => {
    nextEventCounter += 1
    const allDay = variables.allDay ?? true

    const ev = {
      id: 'ev' + nextEventCounter,
      title: variables.title ?? 'Untitled event',
      date: variables.date ?? new Date().toISOString().slice(0, 10),
      accent: variables.accent ? 'orange' : null,
      allDay,
      startTime: allDay ? null : variables.startTime || null,
      endTime: allDay ? null : variables.endTime || null,
      location: variables.location || null,
      notes: variables.notes || null
    }

    calendarEvents = [...calendarEvents, ev]
    return { createCalendarEvent: ev }
  },
  updateCalendarEvent: (variables = {}) => {
    const event = calendarEvents.find(e => e.id === variables.id)

    if (event) {
      if (variables.title !== undefined && variables.title !== null) event.title = variables.title
      if (variables.date !== undefined && variables.date !== null) event.date = variables.date

      if (variables.accent !== undefined && variables.accent !== null) {
        event.accent = variables.accent ? 'orange' : null
      }

      if (variables.allDay !== undefined && variables.allDay !== null) {
        event.allDay = variables.allDay

        // Toggling to allDay also clears any stored times so re-toggling later
        // doesn't surface stale start/end values that the UI ignored anyway.
        if (variables.allDay) {
          event.startTime = null
          event.endTime = null
        }
      }

      if (variables.startTime !== undefined) event.startTime = variables.startTime || null
      if (variables.endTime !== undefined) event.endTime = variables.endTime || null
      if (variables.location !== undefined) event.location = variables.location || null
      if (variables.notes !== undefined) event.notes = variables.notes || null
    }

    return { updateCalendarEvent: event ?? null }
  },
  deleteCalendarEvent: (variables = {}) => {
    const before = calendarEvents.length
    calendarEvents = calendarEvents.filter(e => e.id !== variables.id)
    return { deleteCalendarEvent: calendarEvents.length < before }
  },
  moveTaskToTimeSlot: (variables = {}) => ({
    moveTaskToTimeSlot: {
      id: variables.id,
      scheduledDate: variables.scheduledDate ?? null,
      scheduledTime: variables.scheduledTime ?? null,
      effortMinutes: variables.effortMinutes ?? null
    }
  })
}
