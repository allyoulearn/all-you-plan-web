/**
 * Chores store.
 * Manages the list of household chores and exposes actions to load and
 * complete individual chores via the API.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo.js'
import {
  CHORES_QUERY,
  COMPLETE_CHORE,
  CREATE_CHORE,
  UPDATE_CHORE,
  DELETE_CHORE
} from '@/api/operations/index.js'
import { useErrorToast } from '@/composables/useErrorToast.js'

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
   * @throws Re-throws the API error after showing an error toast
   */
  async function completeChore(id) {
    loading.value = true
    try {
      await apolloClient.mutate({ mutation: COMPLETE_CHORE, variables: { id } })
      await load()
    } catch (e) {
      error.value = e.message
      const { toastError } = useErrorToast()
      toastError(e, 'Failed to complete chore')
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new chore, then refresh the chores list.
   * @param {{ title: string, cadence: { type: string, daysOfWeek?: number[], interval?: number, dayOfMonth?: number } }} input
   * @returns {Promise<object>} Created chore
   * @throws Re-throws the API error after showing an error toast
   */
  async function createChore(input) {
    const { toastError } = useErrorToast()
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_CHORE,
        variables: { title: input.title, cadence: input.cadence }
      })
      await load()
      return data.createChore
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to create chore')
      throw e
    }
  }

  /**
   * Update a chore (title, cadence, or active flag), then refresh the list.
   * @param {string} id - Chore ID
   * @param {{ title?: string, cadence?: object, active?: boolean }} input
   * @returns {Promise<object>}
   */
  async function updateChore(id, input) {
    const { toastError } = useErrorToast()
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_CHORE,
        variables: { id, ...input }
      })
      await load()
      return data.updateChore
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to update chore')
      throw e
    }
  }

  /**
   * Delete a chore by ID, then refresh the list.
   * @param {string} id
   */
  async function deleteChore(id) {
    const { toastError } = useErrorToast()
    try {
      await apolloClient.mutate({ mutation: DELETE_CHORE, variables: { id } })
      await load()
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to delete chore')
      throw e
    }
  }

  return { chores, loading, error, load, completeChore, createChore, updateChore, deleteChore }
})
