import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo'
import { INBOX_ITEMS_QUERY, CREATE_INBOX_ITEM, TRIAGE_INBOX_ITEM } from '@/api/operations'

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
    await apolloClient.mutate({
      mutation: CREATE_INBOX_ITEM,
      variables: { text, source: 'web' },
    })
    await load()
  }

  async function triage(id) {
    await apolloClient.mutate({ mutation: TRIAGE_INBOX_ITEM, variables: { id } })
    await load()
  }

  return { items, loading, error, load, capture, triage }
})
