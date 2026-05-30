import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSearchStore } from '@/stores/search.store'

vi.mock('@/api/apollo', () => ({
  apolloClient: {
    query: vi.fn(),
    mutate: vi.fn(),
    clearStore: vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('@/api/operations', () => ({
  SEARCH_QUERY: 'SEARCH_QUERY',
  RECORD_SEARCH_QUERY: 'RECORD_SEARCH_QUERY'
}))

import { apolloClient } from '@/api/apollo'

const fakeResults = {
  query: 'pasta',
  recent: [],
  tasks: [{ id: 't1', title: 'Make pasta' }],
  projects: [],
  chores: [],
  inbox: [],
  journal: [],
  calendar: [],
  wren: []
}

describe('search.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('starts with empty results and loading=false', () => {
      const store = useSearchStore()
      expect(store.results.query).toBe('')
      expect(store.results.tasks).toEqual([])
      expect(store.loading).toBe(false)
    })
  })

  describe('search()', () => {
    it('populates results from data.search on success', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { search: fakeResults } })
      const store = useSearchStore()
      await store.search('pasta')
      expect(store.results).toEqual(fakeResults)
      expect(store.loading).toBe(false)
    })

    it('falls back to empty results with query when search is null', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { search: null } })
      const store = useSearchStore()
      await store.search('xyz')
      expect(store.results.query).toBe('xyz')
      expect(store.results.tasks).toEqual([])
    })

    it('falls back to empty results with query on failure', async () => {
      apolloClient.query.mockRejectedValueOnce(new Error('search failed'))
      const store = useSearchStore()
      await store.search('foo')
      expect(store.results.query).toBe('foo')
      expect(store.results.tasks).toEqual([])
      expect(store.loading).toBe(false)
    })

    it('sends limit=10', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { search: fakeResults } })
      const store = useSearchStore()
      await store.search('pasta')

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { query: 'pasta', limit: 10 } })
      )
    })
  })

  describe('record()', () => {
    it('records a non-empty query', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useSearchStore()
      await store.record('pasta')

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { query: 'pasta' } })
      )
    })

    it('skips empty queries', async () => {
      const store = useSearchStore()
      await store.record('')
      await store.record('   ')
      await store.record(null)
      await store.record(undefined)
      expect(apolloClient.mutate).not.toHaveBeenCalled()
    })

    it('swallows mutation errors silently', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('record failed'))
      const store = useSearchStore()
      await expect(store.record('pasta')).resolves.toBeUndefined()
    })
  })

  describe('clear()', () => {
    it('resets results back to empty', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { search: fakeResults } })
      const store = useSearchStore()
      await store.search('pasta')
      store.clear()
      expect(store.results.query).toBe('')
      expect(store.results.tasks).toEqual([])
    })
  })
})
