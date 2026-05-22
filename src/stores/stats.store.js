import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo'
import { STATS_QUERY } from '@/api/operations'

export const useStatsStore = defineStore('stats', () => {
  const stats = ref(null)
  const loading = ref(false)
  const error = ref('')

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
