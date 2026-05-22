/**
 * Calendar store.
 * Manages the list of calendar events fetched from the API for a given month.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo.js'
import { CALENDAR_EVENTS_QUERY } from '@/api/operations/index.js'

export const useCalendarStore = defineStore('calendar', () => {
  // -- State --
  const events = ref([])
  const loading = ref(false)
  const error = ref('')

  // -- Actions --

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

  return { events, loading, error, load }
})
