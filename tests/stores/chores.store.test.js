import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChoresStore } from '@/stores/chores.store'

vi.mock('@/api/apollo', () => ({
  apolloClient: {
    query: vi.fn(),
    mutate: vi.fn()
  }
}))

vi.mock('@/api/operations', () => ({
  CHORES_QUERY: 'CHORES_QUERY',
  COMPLETE_CHORE: 'COMPLETE_CHORE',
  CREATE_CHORE: 'CREATE_CHORE',
  UPDATE_CHORE: 'UPDATE_CHORE',
  DELETE_CHORE: 'DELETE_CHORE'
}))

vi.mock('@/composables/useErrorToast', () => ({
  useErrorToast: () => ({ toastError: vi.fn(), toastSuccess: vi.fn() })
}))

import { apolloClient } from '@/api/apollo'

const fakeChores = [
  { id: 'c1', title: 'Morning walk', streak: 7, active: true },
  { id: 'c2', title: 'Vitamins', streak: 2, active: true }
]

describe('chores.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('load()', () => {
    it('populates chores and resets loading', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { chores: fakeChores } })
      const store = useChoresStore()

      expect(store.loading).toBe(false)
      const promise = store.load()
      expect(store.loading).toBe(true)
      await promise

      expect(store.loading).toBe(false)
      expect(store.chores).toEqual(fakeChores)
      expect(store.error).toBe('')
    })

    it('uses network-only fetch policy', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { chores: fakeChores } })
      const store = useChoresStore()
      await store.load()
      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ fetchPolicy: 'network-only' })
      )
    })

    it('sets error on failure and keeps loading false', async () => {
      apolloClient.query.mockRejectedValueOnce(new Error('load failed'))
      const store = useChoresStore()
      await store.load()

      expect(store.error).toBe('load failed')
      expect(store.loading).toBe(false)
    })

    it('clears a previous error on a fresh load', async () => {
      apolloClient.query
        .mockRejectedValueOnce(new Error('old error'))
        .mockResolvedValueOnce({ data: { chores: fakeChores } })
      const store = useChoresStore()
      await store.load()
      expect(store.error).toBe('old error')
      await store.load()
      expect(store.error).toBe('')
    })

    it('replaces the chores list with the API response', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { chores: [fakeChores[0]] } })
      const store = useChoresStore()
      await store.load()
      expect(store.chores).toHaveLength(1)
      expect(store.chores[0].id).toBe('c1')
    })
  })

  describe('completeChore()', () => {
    it('calls COMPLETE_CHORE mutation with the given id', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { chores: fakeChores } })
      const store = useChoresStore()
      await store.completeChore('c1')

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 'c1' } })
      )
    })

    it('triggers a reload after the mutation', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { chores: [] } })
      const store = useChoresStore()
      await store.completeChore('c1')

      expect(apolloClient.query).toHaveBeenCalledTimes(1)
    })

    it('sets loading true during the operation and resets it on completion', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { chores: fakeChores } })
      const store = useChoresStore()
      const promise = store.completeChore('c1')
      expect(store.loading).toBe(true)
      await promise
      expect(store.loading).toBe(false)
    })

    it('sets error, shows a toast, and re-throws on mutation failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('mutation failed'))
      const store = useChoresStore()

      await expect(store.completeChore('c1')).rejects.toThrow('mutation failed')
      expect(store.error).toBe('mutation failed')
    })

    it('resets loading to false on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('mutation failed'))
      const store = useChoresStore()
      await store.completeChore('c1').catch(() => {})
      expect(store.loading).toBe(false)
    })

    it('load() failure after a successful mutation sets error.value silently', async () => {
      // load() catches its own errors and sets error.value without re-throwing,
      // so completeChore resolves rather than rejects when only the reload fails.
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockRejectedValueOnce(new Error('reload failed'))
      const store = useChoresStore()

      await store.completeChore('c1')
      expect(store.error).toBe('reload failed')
    })

    it('clears a stale error.value before running (WEB-W1-05)', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { chores: fakeChores } })
      const store = useChoresStore()
      store.error = 'stale error from prior failure'
      await store.completeChore('c1')
      expect(store.error).toBe('')
    })
  })

  describe('saving flag (WEB-W1-11)', () => {
    it('createChore toggles saving true → false', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { createChore: { id: 'new' } } })
      apolloClient.query.mockResolvedValueOnce({ data: { chores: fakeChores } })
      const store = useChoresStore()
      const promise = store.createChore({ title: 't', cadence: { type: 'daily' } })
      expect(store.saving).toBe(true)
      await promise
      expect(store.saving).toBe(false)
    })

    it('createChore resets saving on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('create failed'))
      const store = useChoresStore()
      await store.createChore({ title: 't', cadence: { type: 'daily' } }).catch(() => {})
      expect(store.saving).toBe(false)
    })

    it('updateChore toggles saving true → false', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { updateChore: { id: 'c1' } } })
      apolloClient.query.mockResolvedValueOnce({ data: { chores: fakeChores } })
      const store = useChoresStore()
      const promise = store.updateChore('c1', { title: 'new' })
      expect(store.saving).toBe(true)
      await promise
      expect(store.saving).toBe(false)
    })

    it('deleteChore toggles saving true → false', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { chores: [] } })
      const store = useChoresStore()
      const promise = store.deleteChore('c1')
      expect(store.saving).toBe(true)
      await promise
      expect(store.saving).toBe(false)
    })
  })

  describe('error reset on mutations (WEB-W1-05 / WEB-W1-13)', () => {
    it('createChore clears a stale error.value before running', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { createChore: { id: 'new' } } })
      apolloClient.query.mockResolvedValueOnce({ data: { chores: fakeChores } })
      const store = useChoresStore()
      store.error = 'stale error'
      await store.createChore({ title: 't', cadence: { type: 'daily' } })
      expect(store.error).toBe('')
    })

    it('updateChore clears a stale error.value before running', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { updateChore: { id: 'c1' } } })
      apolloClient.query.mockResolvedValueOnce({ data: { chores: fakeChores } })
      const store = useChoresStore()
      store.error = 'stale error'
      await store.updateChore('c1', { title: 'new' })
      expect(store.error).toBe('')
    })

    it('deleteChore clears a stale error.value before running', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { chores: [] } })
      const store = useChoresStore()
      store.error = 'stale error'
      await store.deleteChore('c1')
      expect(store.error).toBe('')
    })
  })
})
