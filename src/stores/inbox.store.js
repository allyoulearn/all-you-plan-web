/**
 * Inbox store.
 * Manages the list of untriaged inbox items and exposes actions to load,
 * capture new items, and triage (dismiss/process) existing ones.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo.js'
import {
  INBOX_ITEMS_QUERY,
  CREATE_INBOX_ITEM,
  TRIAGE_INBOX_ITEM,
  DELETE_INBOX_ITEM,
  TRIAGE_INBOX_ITEMS_BULK,
  DELETE_INBOX_ITEMS_BULK,
  CONVERT_INBOX_ITEMS_TO_TASKS
} from '@/api/operations/index.js'
import { useErrorToast } from '@/composables/useErrorToast.js'

export const useInboxStore = defineStore('inbox', () => {
  // -- State --
  const items = ref([])
  const loading = ref(false)
  // Toggled while a mutation is in flight so views can disable submit buttons
  // independently of `loading` (which is owned by `load()`).
  const saving = ref(false)
  const error = ref('')

  // -- Actions --

  /**
   * Fetch all untriaged inbox items from the API and replace the local list.
   */
  async function load() {
    loading.value = true
    error.value = ''

    try {
      const { data } = await apolloClient.query({
        query: INBOX_ITEMS_QUERY,
        variables: { triaged: false },
        fetchPolicy: 'network-only'
      })

      items.value = data.inboxItems
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new inbox item from the given text and refresh the list.
   * Resets `error.value` at the start.
   * @param {string} text - The raw capture text for the new item
   * @throws Re-throws the API error after showing an error toast
   */
  async function capture(text) {
    error.value = ''
    saving.value = true

    try {
      await apolloClient.mutate({
        mutation: CREATE_INBOX_ITEM,
        variables: { text, source: 'web' }
      })

      await load()
    } catch (e) {
      error.value = e.message
      const { toastError } = useErrorToast()
      toastError(e, 'Failed to capture item')
      throw e
    } finally {
      saving.value = false
    }
  }

  /**
   * Mark an inbox item as triaged and refresh the list.
   * Resets `error.value` at the start.
   * @param {string} id - The inbox item ID to triage
   * @throws Re-throws the API error after showing an error toast
   */
  async function triage(id) {
    error.value = ''
    saving.value = true

    try {
      await apolloClient.mutate({ mutation: TRIAGE_INBOX_ITEM, variables: { id } })
      await load()
    } catch (e) {
      error.value = e.message
      const { toastError } = useErrorToast()
      toastError(e, 'Failed to triage item')
      throw e
    } finally {
      saving.value = false
    }
  }

  /** Delete a single inbox item then refresh. */
  async function deleteItem(id) {
    const { toastError } = useErrorToast()
    error.value = ''
    saving.value = true

    try {
      await apolloClient.mutate({ mutation: DELETE_INBOX_ITEM, variables: { id } })
      await load()
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to delete item')
      throw e
    } finally {
      saving.value = false
    }
  }

  /** Triage many items in one round trip. */
  async function triageMany(ids) {
    if (!ids?.length) return
    const { toastError } = useErrorToast()
    error.value = ''
    saving.value = true

    try {
      await apolloClient.mutate({ mutation: TRIAGE_INBOX_ITEMS_BULK, variables: { ids } })
      await load()
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to triage items')
      throw e
    } finally {
      saving.value = false
    }
  }

  /** Delete many items in one round trip. */
  async function deleteMany(ids) {
    if (!ids?.length) return
    const { toastError } = useErrorToast()
    error.value = ''
    saving.value = true

    try {
      await apolloClient.mutate({ mutation: DELETE_INBOX_ITEMS_BULK, variables: { ids } })
      await load()
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to delete items')
      throw e
    } finally {
      saving.value = false
    }
  }

  /** Convert selected items to tasks (optionally pinning project + date). */
  async function convertToTasks(ids, { projectId = null, scheduledDate = null } = {}) {
    if (!ids?.length) return
    const { toastError } = useErrorToast()
    error.value = ''
    saving.value = true

    try {
      await apolloClient.mutate({
        mutation: CONVERT_INBOX_ITEMS_TO_TASKS,
        variables: { ids, projectId, scheduledDate }
      })

      await load()
    } catch (e) {
      error.value = e.message
      toastError(e, 'Failed to convert items')
      throw e
    } finally {
      saving.value = false
    }
  }

  return {
    items,
    loading,
    saving,
    error,
    load,
    capture,
    triage,
    deleteItem,
    triageMany,
    deleteMany,
    convertToTasks
  }
})
