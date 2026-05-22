import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo'
import { JOURNAL_ENTRIES_QUERY, CREATE_JOURNAL_ENTRY } from '@/api/operations'

export const useJournalStore = defineStore('journal', () => {
  const entries = ref([])
  const loading = ref(false)
  const error = ref('')

  async function load() {
    loading.value = true
    error.value = ''
    try {
      const { data } = await apolloClient.query({
        query: JOURNAL_ENTRIES_QUERY,
        fetchPolicy: 'network-only',
      })
      entries.value = data.journalEntries
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function createEntry({ date, prompt, pullQuote, body, tags }) {
    await apolloClient.mutate({
      mutation: CREATE_JOURNAL_ENTRY,
      variables: { date, prompt, pullQuote, body, tags },
    })
    await load()
  }

  return { entries, loading, error, load, createEntry }
})
