/**
 * Stats store.
 * Manages user productivity statistics fetched from the API.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo.js'
import { STATS_QUERY } from '@/api/operations/index.js'

export const useStatsStore = defineStore('stats', () => {
  // -- State --
  const stats = ref(null)
  const loading = ref(false)
  const error = ref('')

  // -- Actions --

  /**
   * Fetch the current user's productivity stats from the API.
   */
  async function load() {
    loading.value = true
    error.value = ''
    try {
      const { data } = await apolloClient.query({
        query: STATS_QUERY,
        fetchPolicy: 'network-only'
      })
      stats.value = data.stats
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return { stats, loading, error, load }
})
