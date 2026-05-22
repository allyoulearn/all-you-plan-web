/**
 * Inbox store.
 * Manages the list of untriaged inbox items and exposes actions to load,
 * capture new items, and triage (dismiss/process) existing ones.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo'
import { INBOX_ITEMS_QUERY, CREATE_INBOX_ITEM, TRIAGE_INBOX_ITEM } from '@/api/operations'
import { useErrorToast } from '@/composables/useErrorToast.js'

export const useInboxStore = defineStore('inbox', () => {
  // -- State --
  const items = ref([])
  const loading = ref(false)
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
   * @param {string} text - The raw capture text for the new item
   * @throws Re-throws the API error after showing an error toast
   */
  async function capture(text) {
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
    }
  }

  /**
   * Mark an inbox item as triaged and refresh the list.
   * @param {string} id - The inbox item ID to triage
   * @throws Re-throws the API error after showing an error toast
   */
  async function triage(id) {
    try {
      await apolloClient.mutate({ mutation: TRIAGE_INBOX_ITEM, variables: { id } })
      await load()
    } catch (e) {
      error.value = e.message
      const { toastError } = useErrorToast()
      toastError(e, 'Failed to triage item')
      throw e
    }
  }

  return { items, loading, error, load, capture, triage }
})
