/**
 * Chores store.
 * Manages the list of household chores and exposes actions to load and
 * complete individual chores via the API.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo'
import { CHORES_QUERY, COMPLETE_CHORE } from '@/api/operations'

export const useChoresStore = defineStore('chores', () => {
  // -- State --
  const chores = ref([])
  const loading = ref(false)
  const error = ref('')

  // -- Actions --

  /**
   * Fetch all chores from the API and replace the local list.
   */
  async function load() {
    loading.value = true
    error.value = ''
    try {
      const { data } = await apolloClient.query({
        query: CHORES_QUERY,
        fetchPolicy: 'network-only'
      })
      chores.value = data.chores
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  /**
   * Mark a chore as complete, then refresh the chores list.
   * @param {string} id - The chore ID to complete
   */
  async function completeChore(id) {
    await apolloClient.mutate({ mutation: COMPLETE_CHORE, variables: { id } })
    await load()
  }

  return { chores, loading, error, load, completeChore }
})
