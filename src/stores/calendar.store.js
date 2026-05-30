/**
 * Calendar store.
 * Manages the list of calendar events fetched from the API for a given month
 * and exposes a rescheduleEvent action for drag-to-day on the monthly grid.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo.js'
import {
  CALENDAR_EVENTS_QUERY,
  UPDATE_CALENDAR_EVENT,
  CREATE_CALENDAR_EVENT,
  DELETE_CALENDAR_EVENT,
  MOVE_TASK_TO_TIME_SLOT
} from '@/api/operations/index.js'
import { useErrorToast } from '@/composables/useErrorToast.js'

export const useCalendarStore = defineStore('calendar', () => {
  const events = ref([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  // Remember the last explicit month so callers (like the Wren sync layer)
  // can refresh the current view by calling load() with no args — without it
  // they'd unintentionally jump the view back to the server's "current month".
  const lastLoadedMonth = ref(null)

  /**
   * Fetch calendar events for the given month from the API.
   * @param {string|null} [month] - ISO month string (e.g. "2024-05"). When
   *   omitted, refetches the month most recently passed (or the server's
   *   current month if none has been loaded yet).
   */
  async function load(month) {
    loading.value = true
    error.value = ''
    const target = month ?? lastLoadedMonth.value ?? null

    try {
      const { data } = await apolloClient.query({
        query: CALENDAR_EVENTS_QUERY,
        variables: { month: target },
        fetchPolicy: 'network-only'
      })

      events.value = data.calendarEvents
      if (target) lastLoadedMonth.value = target
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch a full year of calendar events. Runs 12 month queries in parallel
   * and merges the results, de-duplicating by id so an event that crosses a
   * month boundary doesn't appear twice. Resets `events` once when the
   * fan-out resolves so consumers don't observe partial state mid-load.
   *
   * @param {number} year - Four-digit year (e.g. 2026).
   */
  async function loadYear(year) {
    loading.value = true
    error.value = ''

    try {
      const months = []

      for (let m = 0; m < 12; m++) {
        const key = `${year}-${String(m + 1).padStart(2, '0')}`

        months.push(
          apolloClient.query({
            query: CALENDAR_EVENTS_QUERY,
            variables: { month: key },
            fetchPolicy: 'network-only'
          })
        )
      }

      const results = await Promise.all(months)
      const seen = new Map()

      for (const r of results) {
        for (const ev of r.data.calendarEvents) seen.set(ev.id, ev)
      }

      events.value = Array.from(seen.values())
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  /**
   * Reschedule a calendar event to `date` (YYYY-MM-DD). Optimistic: patch
   * the local entry first, fall back to the snapshot if the mutation fails.
   * The view rerenders the new placement on success without a refetch.
   */
  async function rescheduleEvent(id, date) {
    const { toastError } = useErrorToast()
    const snapshot = events.value
    events.value = events.value.map(e => (e.id === id ? { ...e, date } : e))
    error.value = ''
    saving.value = true

    try {
      await apolloClient.mutate({
        mutation: UPDATE_CALENDAR_EVENT,
        variables: { id, date }
      })
    } catch (e) {
      events.value = snapshot
      error.value = e.message
      toastError(e, 'Failed to reschedule event')
      throw e
    } finally {
      saving.value = false
    }
  }

  /**
   * Create a calendar event on `date` (YYYY-MM-DD). Pushes the result into
   * `events` on success so the grid renders without a refetch.
   * Extra fields (`allDay`, `startTime`, `endTime`, `location`, `notes`)
   * are optional; the resolver defaults `allDay` to true so an
   * undefined `allDay` here behaves like a true all-day event.
   */
  async function createEvent({
    title,
    date,
    accent = false,
    allDay,
    startTime,
    endTime,
    location,
    notes
  }) {
    const { toastError } = useErrorToast()
    error.value = ''
    saving.value = true

    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_CALENDAR_EVENT,
        variables: { title, date, accent, allDay, startTime, endTime, location, notes }
      })

      events.value = [...events.value, data.createCalendarEvent]
      return data.createCalendarEvent
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to create event')
      throw e
    } finally {
      saving.value = false
    }
  }

  /**
   * Update a calendar event. Any of the provided fields may be omitted to
   * leave them untouched. Optimistic patch with snapshot rollback on
   * failure.
   */
  async function updateEvent(
    id,
    { title, date, accent, allDay, startTime, endTime, location, notes }
  ) {
    const { toastError } = useErrorToast()
    const snapshot = events.value

    events.value = events.value.map(e =>
      e.id === id
        ? {
            ...e,
            ...(title !== undefined ? { title } : {}),
            ...(date !== undefined ? { date } : {}),
            ...(accent !== undefined ? { accent } : {}),
            ...(allDay !== undefined ? { allDay } : {}),
            // When switching to all-day, mirror the server-side rule and
            // clear local start/end so the row doesn't flash old times
            // before the mutation resolves.
            ...(allDay === true ? { startTime: null, endTime: null } : {}),
            ...(startTime !== undefined && allDay !== true ? { startTime } : {}),
            ...(endTime !== undefined && allDay !== true ? { endTime } : {}),
            ...(location !== undefined ? { location } : {}),
            ...(notes !== undefined ? { notes } : {})
          }
        : e
    )

    error.value = ''
    saving.value = true

    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_CALENDAR_EVENT,
        variables: { id, title, date, accent, allDay, startTime, endTime, location, notes }
      })

      return data.updateCalendarEvent
    } catch (e) {
      events.value = snapshot
      error.value = e.message
      toastError(e, 'Failed to update event')
      throw e
    } finally {
      saving.value = false
    }
  }

  /**
   * Delete a calendar event. Optimistic removal with rollback on failure.
   */
  async function deleteEvent(id) {
    const { toastError } = useErrorToast()
    const snapshot = events.value
    events.value = events.value.filter(e => e.id !== id)
    error.value = ''
    saving.value = true

    try {
      await apolloClient.mutate({ mutation: DELETE_CALENDAR_EVENT, variables: { id } })
    } catch (e) {
      events.value = snapshot
      error.value = e.message
      toastError(e, 'Failed to delete event')
      throw e
    } finally {
      saving.value = false
    }
  }

  /**
   * Atomically set a task's scheduledDate, scheduledTime, and effortMinutes —
   * used by the week-view drag-to-slot flow. Caller is responsible for the
   * optimistic UI; this action only forwards the mutation and surfaces any
   * server error.
   */
  async function moveTaskToTimeSlot(id, scheduledDate, scheduledTime, effortMinutes) {
    const { toastError } = useErrorToast()
    error.value = ''
    saving.value = true

    try {
      await apolloClient.mutate({
        mutation: MOVE_TASK_TO_TIME_SLOT,
        variables: { id, scheduledDate, scheduledTime, effortMinutes }
      })
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to move task')
      throw e
    } finally {
      saving.value = false
    }
  }

  return {
    events,
    loading,
    saving,
    error,
    lastLoadedMonth,
    load,
    loadYear,
    rescheduleEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    moveTaskToTimeSlot
  }
})
