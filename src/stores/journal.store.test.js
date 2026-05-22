import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useJournalStore } from './journal.store'

vi.mock('@/api/apollo', () => ({
  apolloClient: {
    query: vi.fn(),
    mutate: vi.fn(),
  },
}))

vi.mock('@/api/operations', () => ({
  JOURNAL_ENTRIES_QUERY: 'JOURNAL_ENTRIES_QUERY',
  CREATE_JOURNAL_ENTRY: 'CREATE_JOURNAL_ENTRY',
}))

vi.mock('@/composables/useErrorToast', () => ({
  useErrorToast: () => ({ toastError: vi.fn(), toastSuccess: vi.fn() }),
}))

import { apolloClient } from '@/api/apollo'

const fakeEntries = [
  { id: 'e1', date: '2026-05-21', body: 'Good day', tags: [] },
  { id: 'e2', date: '2026-05-20', body: 'Productive', tags: ['work'] },
]

const newEntryInput = {
  date: '2026-05-21',
  prompt: 'What went well?',
  pullQuote: 'Everything',
  body: 'It was great',
  tags: ['personal'],
}

describe('journal.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
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

    it('sets error on failure', async () => {
      apolloClient.query.mockRejectedValueOnce(new Error('load failed'))
      const store = useJournalStore()
      await store.load()

      expect(store.error).toBe('load failed')
      expect(store.loading).toBe(false)
    })
  })

  describe('createEntry()', () => {
    it('calls CREATE_JOURNAL_ENTRY with all fields and reloads', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { journalEntries: fakeEntries } })
      const store = useJournalStore()
      await store.createEntry(newEntryInput)

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: newEntryInput }),
      )
      expect(apolloClient.query).toHaveBeenCalledTimes(1)
    })

    it('sets error and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('save failed'))
      const store = useJournalStore()

      await expect(store.createEntry(newEntryInput)).rejects.toThrow('save failed')
      expect(store.error).toBe('save failed')
    })
  })
})
