import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useInboxStore } from '@/stores/inbox.store'

vi.mock('@/api/apollo', () => ({
  apolloClient: {
    query: vi.fn(),
    mutate: vi.fn()
  }
}))

vi.mock('@/api/operations', () => ({
  INBOX_ITEMS_QUERY: 'INBOX_ITEMS_QUERY',
  CREATE_INBOX_ITEM: 'CREATE_INBOX_ITEM',
  TRIAGE_INBOX_ITEM: 'TRIAGE_INBOX_ITEM'
}))

vi.mock('@/composables/useErrorToast', () => ({
  useErrorToast: () => ({ toastError: vi.fn(), toastSuccess: vi.fn() })
}))

import { apolloClient } from '@/api/apollo'

const fakeItems = [
  { id: 'i1', text: 'Buy milk', triaged: false },
  { id: 'i2', text: 'Read article', triaged: false }
]

describe('inbox.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('load()', () => {
    it('populates items and resets loading/error', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { inboxItems: fakeItems } })
      const store = useInboxStore()

      const promise = store.load()
      expect(store.loading).toBe(true)
      await promise

      expect(store.loading).toBe(false)
      expect(store.items).toEqual(fakeItems)
      expect(store.error).toBe('')
    })

    it('sets error on failure', async () => {
      apolloClient.query.mockRejectedValueOnce(new Error('load failed'))
      const store = useInboxStore()
      await store.load()

      expect(store.error).toBe('load failed')
      expect(store.loading).toBe(false)
    })
  })

  describe('capture()', () => {
    it('creates the item and reloads', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { inboxItems: fakeItems } })
      const store = useInboxStore()
      await store.capture('New idea')

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { text: 'New idea', source: 'web' } })
      )
      expect(apolloClient.query).toHaveBeenCalledTimes(1)
    })

    it('sets error and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('capture failed'))
      const store = useInboxStore()

      await expect(store.capture('New idea')).rejects.toThrow('capture failed')
      expect(store.error).toBe('capture failed')
    })
  })

  describe('triage()', () => {
    it('calls TRIAGE_INBOX_ITEM mutation and reloads', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { inboxItems: [] } })
      const store = useInboxStore()
      await store.triage('i1')

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 'i1' } })
      )
      expect(apolloClient.query).toHaveBeenCalledTimes(1)
    })

    it('sets error and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('triage failed'))
      const store = useInboxStore()

      await expect(store.triage('i1')).rejects.toThrow('triage failed')
      expect(store.error).toBe('triage failed')
    })
  })
})
