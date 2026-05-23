/**
 * Journal store.
 * Manages the list of journal entries and exposes actions to load all entries
 * and create new ones.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo.js'
import { JOURNAL_ENTRIES_QUERY, CREATE_JOURNAL_ENTRY } from '@/api/operations/index.js'
import { useErrorToast } from '@/composables/useErrorToast.js'

export const useJournalStore = defineStore('journal', () => {
  // -- State --
  const entries = ref([])
  const loading = ref(false)
  // Toggled while a mutation is in flight so views can disable submit buttons
  // independently of `loading` (which is owned by `load()`). See WEB-W1-11.
  const saving = ref(false)
  const error = ref('')

  // -- Actions --

  /**
   * Fetch all journal entries from the API and replace the local list.
   */
  async function load() {
    loading.value = true
    error.value = ''
    try {
      const { data } = await apolloClient.query({
        query: JOURNAL_ENTRIES_QUERY,
        fetchPolicy: 'network-only'
      })
      entries.value = data.journalEntries
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new journal entry and refresh the entries list.
   * Resets `error.value` at the start (WEB-W1-05 / WEB-W1-13).
   * @param {object} entry
   * @param {string} entry.date - ISO date string for the entry (e.g. "2024-05-22")
   * @param {string} [entry.prompt] - Optional writing prompt used for the entry
   * @param {string} [entry.pullQuote] - Optional highlighted pull quote
   * @param {string} entry.body - Main body text of the entry
   * @param {string[]} [entry.tags] - Optional array of tag strings
   * @throws Re-throws the API error after showing an error toast
   */
  async function createEntry({ date, prompt, pullQuote, body, tags }) {
    error.value = ''
    saving.value = true
    try {
      await apolloClient.mutate({
        mutation: CREATE_JOURNAL_ENTRY,
        variables: { date, prompt, pullQuote, body, tags }
      })
      await load()
    } catch (e) {
      error.value = e.message
      const { toastError } = useErrorToast()
      toastError(e, 'Failed to save journal entry')
      throw e
    } finally {
      saving.value = false
    }
  }

  return { entries, loading, saving, error, load, createEntry }
})
