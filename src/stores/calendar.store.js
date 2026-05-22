import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo'
import { CALENDAR_EVENTS_QUERY } from '@/api/operations'

export const useCalendarStore = defineStore('calendar', () => {
  const events = ref([])
  const loading = ref(false)
  const error = ref('')

  async function load(month) {
    loading.value = true
    error.value = ''
    try {
      const { data } = await apolloClient.query({
        query: CALENDAR_EVENTS_QUERY,
        variables: { month: month ?? null },
        fetchPolicy: 'network-only',
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
