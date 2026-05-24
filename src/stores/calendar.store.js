/**
 * Calendar store.
 * Manages the list of calendar events fetched from the API for a given month
 * and exposes a rescheduleEvent action for drag-to-day on the monthly grid.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo.js'
import { CALENDAR_EVENTS_QUERY, UPDATE_CALENDAR_EVENT } from '@/api/operations/index.js'
import { useErrorToast } from '@/composables/useErrorToast.js'

export const useCalendarStore = defineStore('calendar', () => {
  const events = ref([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')

  /**
   * Fetch calendar events for the given month from the API.
   * @param {string|null} [month] - ISO month string (e.g. "2024-05"). Defaults to current month when `null`.
   */
  async function load(month) {
    loading.value = true
    error.value = ''
    try {
      const { data } = await apolloClient.query({
        query: CALENDAR_EVENTS_QUERY,
        variables: { month: month ?? null },
        fetchPolicy: 'network-only'
      })
      events.value = data.calendarEvents
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

  return { events, loading, saving, error, load, rescheduleEvent }
})
