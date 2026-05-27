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
  DELETE_CHORE,
  SNOOZE_CHORE,
  SKIP_NEXT_CHORE,
  RESUME_CHORE
} from '@/api/operations/index.js'
import { useErrorToast } from '@/composables/useErrorToast.js'

export const useChoresStore = defineStore('chores', () => {
  // -- State --
  const chores = ref([])
  const loading = ref(false)
  // Toggled while a mutation is in flight so views can disable submit buttons
  // independently of `loading` (which is owned by `load()`).
  const saving = ref(false)
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
   * Resets `error.value` at the start so a stale message from a prior failure
   * does not persist past a successful mutation.
   * @param {string} id - The chore ID to complete
   * @throws Re-throws the API error after showing an error toast
   */
  async function completeChore(id) {
    loading.value = true
    error.value = ''

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
   * Resets `error.value` at the start so stale failures do not persist past a
   * successful mutation.
   * @param {{ title: string, cadence: { type: string, daysOfWeek?: number[], interval?: number, dayOfMonth?: number } }} input
   * @returns {Promise<object>} Created chore
   * @throws Re-throws the API error after showing an error toast
   */
  async function createChore(input) {
    const { toastError } = useErrorToast()
    error.value = ''
    saving.value = true

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
    } finally {
      saving.value = false
    }
  }

  /**
   * Update a chore (title, cadence, or active flag), then refresh the list.
   * Resets `error.value` at the start.
   * @param {string} id - Chore ID
   * @param {{ title?: string, cadence?: object, active?: boolean }} input
   * @returns {Promise<object>}
   */
  async function updateChore(id, input) {
    const { toastError } = useErrorToast()
    error.value = ''
    saving.value = true

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
    } finally {
      saving.value = false
    }
  }

  /**
   * Delete a chore by ID, then refresh the list.
   * Resets `error.value` at the start.
   * @param {string} id
   */
  async function deleteChore(id) {
    const { toastError } = useErrorToast()
    error.value = ''
    saving.value = true

    try {
      await apolloClient.mutate({ mutation: DELETE_CHORE, variables: { id } })
      await load()
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to delete chore')
      throw e
    } finally {
      saving.value = false
    }
  }

  /**
   * Snooze a chore until the given ISO date or datetime, hiding it from
   * daily materialization while the snooze window is open. Refreshes the
   * chores list on success so the UI reflects the new snoozedUntil.
   */
  async function snoozeChore(id, until) {
    const { toastError } = useErrorToast()
    error.value = ''
    saving.value = true

    try {
      const { data } = await apolloClient.mutate({
        mutation: SNOOZE_CHORE,
        variables: { id, until }
      })

      await load()
      return data.snoozeChore
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to snooze chore')
      throw e
    } finally {
      saving.value = false
    }
  }

  /** Skip just the next occurrence of a chore. */
  async function skipNextChore(id) {
    const { toastError } = useErrorToast()
    error.value = ''
    saving.value = true

    try {
      const { data } = await apolloClient.mutate({
        mutation: SKIP_NEXT_CHORE,
        variables: { id }
      })

      await load()
      return data.skipNextChore
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to skip chore')
      throw e
    } finally {
      saving.value = false
    }
  }

  /** Clear snoozedUntil so the chore resumes immediately. */
  async function resumeChore(id) {
    const { toastError } = useErrorToast()
    error.value = ''
    saving.value = true

    try {
      const { data } = await apolloClient.mutate({
        mutation: RESUME_CHORE,
        variables: { id }
      })

      await load()
      return data.resumeChore
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to resume chore')
      throw e
    } finally {
      saving.value = false
    }
  }

  /**
   * Persist a new ordering by issuing one updateChore mutation per id.
   * `ids` is the desired full sequence; the index becomes the chore's order.
   */
  async function reorderChores(ids) {
    const { toastError } = useErrorToast()
    error.value = ''
    saving.value = true

    try {
      for (let i = 0; i < ids.length; i++) {
        await apolloClient.mutate({
          mutation: UPDATE_CHORE,
          variables: { id: ids[i], order: i }
        })
      }
      await load()
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to reorder chores')
      throw e
    } finally {
      saving.value = false
    }
  }

  return {
    chores,
    loading,
    saving,
    error,
    load,
    completeChore,
    createChore,
    updateChore,
    deleteChore,
    snoozeChore,
    skipNextChore,
    resumeChore,
    reorderChores
  }
})
