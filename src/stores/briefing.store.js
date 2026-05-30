/**
 * Briefing store. Holds Wren's morning briefing payload + state.
 * Loaded once on Today view mount; regenerate() forces a fresh server call.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo.js'
import { TODAY_BRIEFING_QUERY, REGENERATE_TODAY_BRIEFING } from '@/api/operations/index.js'

export const useBriefingStore = defineStore('briefing', () => {
  const briefing = ref(null)
  const loading = ref(false)
  const error = ref('')

  /**
   * Fetch today's briefing from the API. Falls back to an empty resting
   * payload on error so the UI never renders against null.
   * @param {boolean} [force] - When true, asks the server to bypass any cached briefing.
   */
  async function load(force = false) {
    loading.value = true
    error.value = ''

    try {
      const { data } = await apolloClient.query({
        query: TODAY_BRIEFING_QUERY,
        variables: { force },
        fetchPolicy: 'network-only'
      })

      briefing.value = data.todayBriefing
    } catch (e) {
      error.value = e.message

      briefing.value = {
        state: 'resting',
        greeting: '',
        tone: 'warm',
        actions: [],
        generatedAt: null,
        expiresAt: null
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Force a fresh briefing generation on the server and store the result.
   */
  async function regenerate() {
    loading.value = true
    error.value = ''

    try {
      const { data } = await apolloClient.mutate({ mutation: REGENERATE_TODAY_BRIEFING })
      briefing.value = data.regenerateTodayBriefing
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return { briefing, loading, error, load, regenerate }
})
