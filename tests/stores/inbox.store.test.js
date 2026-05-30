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
  TRIAGE_INBOX_ITEM: 'TRIAGE_INBOX_ITEM',
  DELETE_INBOX_ITEM: 'DELETE_INBOX_ITEM',
  TRIAGE_INBOX_ITEMS_BULK: 'TRIAGE_INBOX_ITEMS_BULK',
  DELETE_INBOX_ITEMS_BULK: 'DELETE_INBOX_ITEMS_BULK',
  CONVERT_INBOX_ITEMS_TO_TASKS: 'CONVERT_INBOX_ITEMS_TO_TASKS'
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

  describe('initial state', () => {
    it('has an empty items array', () => {
      const store = useInboxStore()
      expect(store.items).toEqual([])
    })

    it('loading is false initially', () => {
      const store = useInboxStore()
      expect(store.loading).toBe(false)
    })

    it('error is empty string initially', () => {
      const store = useInboxStore()
      expect(store.error).toBe('')
    })
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

    it('queries with triaged: false', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { inboxItems: fakeItems } })
      const store = useInboxStore()
      await store.load()

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { triaged: false } })
      )
    })

    it('uses network-only fetch policy', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { inboxItems: fakeItems } })
      const store = useInboxStore()
      await store.load()

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ fetchPolicy: 'network-only' })
      )
    })

    it('sets error on failure', async () => {
      apolloClient.query.mockRejectedValueOnce(new Error('load failed'))
      const store = useInboxStore()
      await store.load()

      expect(store.error).toBe('load failed')
      expect(store.loading).toBe(false)
    })

    it('clears a previous error on a fresh load', async () => {
      apolloClient.query
        .mockRejectedValueOnce(new Error('old error'))
        .mockResolvedValueOnce({ data: { inboxItems: fakeItems } })

      const store = useInboxStore()
      await store.load()
      expect(store.error).toBe('old error')
      await store.load()
      expect(store.error).toBe('')
    })

    it('replaces the items list with the API response', async () => {
      apolloClient.query
        .mockResolvedValueOnce({ data: { inboxItems: fakeItems } })
        .mockResolvedValueOnce({ data: { inboxItems: [fakeItems[0]] } })

      const store = useInboxStore()
      await store.load()
      expect(store.items).toHaveLength(2)
      await store.load()
      expect(store.items).toHaveLength(1)
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

    it('updates items after successful capture', async () => {
      const newItem = { id: 'i3', text: 'New idea', triaged: false }
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { inboxItems: [...fakeItems, newItem] } })
      const store = useInboxStore()
      await store.capture('New idea')

      expect(store.items).toHaveLength(3)
      expect(store.items[2]).toEqual(newItem)
    })

    it('sets error and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('capture failed'))
      const store = useInboxStore()

      await expect(store.capture('New idea')).rejects.toThrow('capture failed')
      expect(store.error).toBe('capture failed')
    })

    it('does not reload when capture fails', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('capture failed'))
      const store = useInboxStore()
      await store.capture('New idea').catch(() => {})
      expect(apolloClient.query).not.toHaveBeenCalled()
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

    it('removes the triaged item from the list after reload', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { inboxItems: [fakeItems[1]] } })
      const store = useInboxStore()
      store.items = [...fakeItems]
      await store.triage('i1')

      expect(store.items).toHaveLength(1)
      expect(store.items[0].id).toBe('i2')
    })

    it('sets error and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('triage failed'))
      const store = useInboxStore()

      await expect(store.triage('i1')).rejects.toThrow('triage failed')
      expect(store.error).toBe('triage failed')
    })

    it('does not reload when triage fails', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('triage failed'))
      const store = useInboxStore()
      await store.triage('i1').catch(() => {})
      expect(apolloClient.query).not.toHaveBeenCalled()
    })
  })

  describe('deleteItem()', () => {
    it('calls DELETE_INBOX_ITEM mutation and reloads', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { inboxItems: [fakeItems[1]] } })
      const store = useInboxStore()
      await store.deleteItem('i1')

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 'i1' } })
      )

      expect(apolloClient.query).toHaveBeenCalledTimes(1)
      expect(store.items).toHaveLength(1)
    })

    it('sets error and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('delete failed'))
      const store = useInboxStore()

      await expect(store.deleteItem('i1')).rejects.toThrow('delete failed')
      expect(store.error).toBe('delete failed')
    })

    it('resets saving on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('fail'))
      const store = useInboxStore()
      await store.deleteItem('i1').catch(() => {})
      expect(store.saving).toBe(false)
    })
  })

  describe('triageMany()', () => {
    it('returns early when ids is empty', async () => {
      const store = useInboxStore()
      await store.triageMany([])
      expect(apolloClient.mutate).not.toHaveBeenCalled()
    })

    it('returns early when ids is undefined', async () => {
      const store = useInboxStore()
      await store.triageMany()
      expect(apolloClient.mutate).not.toHaveBeenCalled()
    })

    it('calls TRIAGE_INBOX_ITEMS_BULK and reloads', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { inboxItems: [] } })
      const store = useInboxStore()
      await store.triageMany(['i1', 'i2'])

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { ids: ['i1', 'i2'] } })
      )

      expect(apolloClient.query).toHaveBeenCalledTimes(1)
    })

    it('sets error and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('bulk triage failed'))
      const store = useInboxStore()

      await expect(store.triageMany(['i1'])).rejects.toThrow('bulk triage failed')
      expect(store.error).toBe('bulk triage failed')
    })
  })

  describe('deleteMany()', () => {
    it('returns early when ids is empty', async () => {
      const store = useInboxStore()
      await store.deleteMany([])
      expect(apolloClient.mutate).not.toHaveBeenCalled()
    })

    it('calls DELETE_INBOX_ITEMS_BULK and reloads', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { inboxItems: [] } })
      const store = useInboxStore()
      await store.deleteMany(['i1', 'i2'])

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { ids: ['i1', 'i2'] } })
      )

      expect(apolloClient.query).toHaveBeenCalledTimes(1)
    })

    it('sets error and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('bulk delete failed'))
      const store = useInboxStore()

      await expect(store.deleteMany(['i1'])).rejects.toThrow('bulk delete failed')
      expect(store.error).toBe('bulk delete failed')
    })
  })

  describe('convertToTasks()', () => {
    it('returns early when ids is empty', async () => {
      const store = useInboxStore()
      await store.convertToTasks([])
      expect(apolloClient.mutate).not.toHaveBeenCalled()
    })

    it('returns early when ids is undefined', async () => {
      const store = useInboxStore()
      await store.convertToTasks()
      expect(apolloClient.mutate).not.toHaveBeenCalled()
    })

    it('calls CONVERT_INBOX_ITEMS_TO_TASKS with null projectId/scheduledDate by default', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { inboxItems: [] } })
      const store = useInboxStore()
      await store.convertToTasks(['i1', 'i2'])

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { ids: ['i1', 'i2'], projectId: null, scheduledDate: null }
        })
      )
    })

    it('forwards projectId and scheduledDate', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { inboxItems: [] } })
      const store = useInboxStore()
      await store.convertToTasks(['i1'], { projectId: 'p1', scheduledDate: '2026-05-22' })

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { ids: ['i1'], projectId: 'p1', scheduledDate: '2026-05-22' }
        })
      )
    })

    it('sets error and re-throws on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('convert failed'))
      const store = useInboxStore()

      await expect(store.convertToTasks(['i1'])).rejects.toThrow('convert failed')
      expect(store.error).toBe('convert failed')
    })
  })

  describe('error reset and saving flag (WEB-W1-05 / WEB-W1-11)', () => {
    it('capture clears a stale error before running', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { inboxItems: fakeItems } })
      const store = useInboxStore()
      store.error = 'stale'
      await store.capture('hi')
      expect(store.error).toBe('')
    })

    it('capture toggles saving true → false', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { inboxItems: fakeItems } })
      const store = useInboxStore()
      const promise = store.capture('hi')
      expect(store.saving).toBe(true)
      await promise
      expect(store.saving).toBe(false)
    })

    it('capture resets saving on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('fail'))
      const store = useInboxStore()
      await store.capture('hi').catch(() => {})
      expect(store.saving).toBe(false)
    })

    it('triage clears a stale error and toggles saving', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { inboxItems: [] } })
      const store = useInboxStore()
      store.error = 'stale'
      const promise = store.triage('i1')
      expect(store.saving).toBe(true)
      await promise
      expect(store.error).toBe('')
      expect(store.saving).toBe(false)
    })
  })
})
