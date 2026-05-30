/**
 * Search store. Holds query text, results grouped by domain, and a recent-
 * queries list shown when the query is empty.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo.js'
import { SEARCH_QUERY, RECORD_SEARCH_QUERY } from '@/api/operations/index.js'

const EMPTY_RESULTS = {
  query: '',
  recent: [],
  tasks: [],
  projects: [],
  chores: [],
  inbox: [],
  journal: [],
  calendar: [],
  wren: []
}

export const useSearchStore = defineStore('search', () => {
  const results = ref({ ...EMPTY_RESULTS })
  const loading = ref(false)

  /**
   * Run a global search for `query` and store grouped results. Errors fall
   * back to an empty result set so the palette never renders against null.
   * @param {string} query
   */
  async function search(query) {
    loading.value = true

    try {
      const { data } = await apolloClient.query({
        query: SEARCH_QUERY,
        variables: { query, limit: 10 },
        fetchPolicy: 'network-only'
      })

      results.value = data.search ?? { ...EMPTY_RESULTS, query }
    } catch {
      results.value = { ...EMPTY_RESULTS, query }
    } finally {
      loading.value = false
    }
  }

  /**
   * Record a query so it appears in the recent-queries list. Fire-and-forget.
   * @param {string} query
   */
  async function record(query) {
    if (!query?.trim()) return

    try {
      await apolloClient.mutate({ mutation: RECORD_SEARCH_QUERY, variables: { query } })
    } catch {
      /* recording is fire-and-forget */
    }
  }

  /** Reset results to the empty default — used when the palette closes. */
  function clear() {
    results.value = { ...EMPTY_RESULTS }
  }

  return { results, loading, search, record, clear }
})
