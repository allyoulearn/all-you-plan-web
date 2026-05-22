import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChoresStore } from './chores.store'

vi.mock('@/api/apollo', () => ({
  apolloClient: {
    query: vi.fn(),
    mutate: vi.fn(),
  },
}))

vi.mock('@/api/operations', () => ({
  CHORES_QUERY: 'CHORES_QUERY',
  COMPLETE_CHORE: 'COMPLETE_CHORE',
}))

import { apolloClient } from '@/api/apollo'

const fakeChores = [
  { id: 'c1', title: 'Morning walk', streak: 7, active: true },
  { id: 'c2', title: 'Vitamins', streak: 2, active: true },
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
  })

  describe('completeChore()', () => {
    it('calls COMPLETE_CHORE mutation with the given id', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { chores: fakeChores } })
      const store = useChoresStore()
      await store.completeChore('c1')

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 'c1' } }),
      )
    })

    it('triggers a reload after the mutation', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      apolloClient.query.mockResolvedValueOnce({ data: { chores: [] } })
      const store = useChoresStore()
      await store.completeChore('c1')

      expect(apolloClient.query).toHaveBeenCalledTimes(1)
    })
  })
})
