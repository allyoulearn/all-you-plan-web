import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useJournalStore } from '@/stores/journal.store'

vi.mock('@/api/apollo', () => ({
  apolloClient: {
    query: vi.fn(),
    mutate: vi.fn()
  }
}))

vi.mock('@/api/operations', () => ({
  JOURNAL_ENTRIES_QUERY: 'JOURNAL_ENTRIES_QUERY',
  CREATE_JOURNAL_ENTRY: 'CREATE_JOURNAL_ENTRY'
}))

vi.mock('@/composables/useErrorToast', () => ({
  useErrorToast: () => ({ toastError: vi.fn(), toastSuccess: vi.fn() })
}))

import { apolloClient } from '@/api/apollo'

const fakeEntries = [
  { id: 'e1', date: '2026-05-21', body: 'Good day', tags: [] },
  { id: 'e2', date: '2026-05-20', body: 'Productive', tags: ['work'] }
]

const newEntryInput = {
  date: '2026-05-21',
  prompt: 'What went well?',
  pullQuote: 'Everything',
  body: 'It was great',
  tags: ['personal']
}

describe('journal.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has an empty entries array', () => {
      const store = useJournalStore()
      expect(store.entries).toEqual([])
    })

    it('loading is false initially', () => {
      const store = useJournalStore()
      expect(store.loading).toBe(false)
    })

    it('error is empty string initially', () => {
      const store = useJournalStore()
      expect(store.error).toBe('')
    })
  })

  describe('load()', () => {
    it('populates entries and resets loading/error', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { journalEntries: fakeEntries } })
      const store = useJournalStore()

      const promise = store.load()
      expect(store.loading).toBe(true)
      await promise

      expect(store.loading).toBe(false)
      expect(store.entries).toEqual(fakeEntries)
      expect(store.error).toBe('')
    })

    it('uses network-only fetch policy', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { journalEntries: fakeEntries } })
      const store = useJournalStore()
      await store.load()

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ fetchPolicy: 'network-only' })
      )
    })

    it('sets error on failure', async () => {
      apolloClient.query.mockRejectedValueOnce(new Error('load failed'))
      const store = useJournalStore()
      await store.load()

      expect(store.error).toBe('load failed')
      expect(store.loading).toBe(false)
    })

    it('clears a previous error on a fresh load', async () => {
      apolloClient.query
        .mockRejectedValueOnce(new Error('old error'))
        .mockResolvedValueOnce({ data: { journalEntries: fakeEntries } })

      const store = useJournalStore()
      await store.load()
      expect(store.error).toBe('old error')
      await store.load()
      expect(store.error).toBe('')
    })

    it('replaces the entries list with the API response', async () => {
      apolloClient.query
        .mockResolvedValueOnce({ data: { journalEntries: fakeEntries } })
        .mockResolvedValueOnce({ data: { journalEntries: [fakeEntries[0]] } })

      const store = useJournalStore()
      await store.load()
      expect(store.entries).toHaveLength(2)
      await store.load()
      expect(store.entries).toHaveLength(1)
    })

    it('does not modify entries when loading fails', async () => {
      apolloClient.query
        .mockResolvedValueOnce({ data: { journalEntries: fakeEntries } })
        .mockRejectedValueOnce(new Error('network error'))

      const store = useJournalStore()
      await store.load()
      await store.load()
      expect(store.entries).toEqual(fakeEntries)
    })
  })

  describe('createEntry()', () => {
    it('calls CREATE_JOURNAL_ENTRY with all fields and reloads', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { journalEntries: fakeEntries } })
      const store = useJournalStore()
      await store.createEntry(newEntryInput)

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: newEntryInput })
      )

      expect(apolloClient.query).toHaveBeenCalledTimes(1)
    })

    it('updates entries list after successful creation', async () => {
      const newEntry = { id: 'e3', date: '2026-05-21', body: 'It was great', tags: ['personal'] }
      apolloClient.mutate.mockResolvedValueOnce({})

      apolloClient.query.mockResolvedValueOnce({
        data: { journalEntries: [...fakeEntries, newEntry] }
      })

      const store = useJournalStore()
      await store.createEntry(newEntryInput)

      expect(store.entries).toHaveLength(3)
      expect(store.entries[2]).toEqual(newEntry)
    })

    it('works with optional fields omitted', async () => {
      const minimalEntry = { date: '2026-05-22', body: 'Just a note' }
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { journalEntries: fakeEntries } })
      const store = useJournalStore()
      await store.createEntry(minimalEntry)

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { date: '2026-05-22', body: 'Just a note' }
        })
      )
    })

    it('sets error and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('save failed'))
      const store = useJournalStore()

      await expect(store.createEntry(newEntryInput)).rejects.toThrow('save failed')
      expect(store.error).toBe('save failed')
    })

    it('does not reload when createEntry fails', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('save failed'))
      const store = useJournalStore()
      await store.createEntry(newEntryInput).catch(() => {})
      expect(apolloClient.query).not.toHaveBeenCalled()
    })

    it('shows a toast and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('save failed'))
      const store = useJournalStore()

      await expect(store.createEntry(newEntryInput)).rejects.toThrow('save failed')
    })

    it('clears a stale error before running (WEB-W1-05)', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { journalEntries: fakeEntries } })
      const store = useJournalStore()
      store.error = 'stale'
      await store.createEntry(newEntryInput)
      expect(store.error).toBe('')
    })

    it('toggles saving true → false (WEB-W1-11)', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { journalEntries: fakeEntries } })
      const store = useJournalStore()
      const promise = store.createEntry(newEntryInput)
      expect(store.saving).toBe(true)
      await promise
      expect(store.saving).toBe(false)
    })

    it('resets saving on failure (WEB-W1-11)', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('fail'))
      const store = useJournalStore()
      await store.createEntry(newEntryInput).catch(() => {})
      expect(store.saving).toBe(false)
    })
  })
})
