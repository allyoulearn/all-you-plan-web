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
  // independently of `loading` (which is owned by `load()`).
  const saving = ref(false)
  const error = ref('')
  // Remember the active tag filter so callers (like the Wren sync layer) can
  // refresh without dropping the user's filter selection.
  const lastTag = ref(null)

  // -- Actions --

  /**
   * Fetch journal entries. Pass `{ tag }` to filter to entries tagged with
   * the given string; pass `{ tag: null }` to clear; omit the argument to
   * refetch with the previously-selected filter (or no filter on first load).
   */
  async function load(opts) {
    loading.value = true
    error.value = ''
    const tag = opts === undefined ? lastTag.value : (opts?.tag ?? null)

    try {
      const variables = {}
      if (tag) variables.tag = tag

      const { data } = await apolloClient.query({
        query: JOURNAL_ENTRIES_QUERY,
        variables,
        fetchPolicy: 'network-only'
      })

      entries.value = data.journalEntries
      if (opts !== undefined) lastTag.value = tag
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new journal entry and refresh the entries list.
   * Resets `error.value` at the start.
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

  return { entries, loading, saving, error, lastTag, load, createEntry }
})
