import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo'
import { INBOX_ITEMS_QUERY, CREATE_INBOX_ITEM, TRIAGE_INBOX_ITEM } from '@/api/operations'
import { useErrorToast } from '@/composables/useErrorToast'

export const useInboxStore = defineStore('inbox', () => {
  const items = ref([])
  const loading = ref(false)
  const error = ref('')

  async function load() {
    loading.value = true
    error.value = ''
    try {
      const { data } = await apolloClient.query({
        query: INBOX_ITEMS_QUERY,
        variables: { triaged: false },
        fetchPolicy: 'network-only',
      })
      items.value = data.inboxItems
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function capture(text) {
    try {
      await apolloClient.mutate({
        mutation: CREATE_INBOX_ITEM,
        variables: { text, source: 'web' },
      })
      await load()
    } catch (e) {
      error.value = e.message
      const { toastError } = useErrorToast()
      toastError(e, 'Failed to capture item')
      throw e
    }
  }

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
