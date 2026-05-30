import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSessionsStore } from '@/stores/sessions.store'

vi.mock('@/api/apollo', () => ({
  apolloClient: {
    query: vi.fn(),
    mutate: vi.fn(),
    clearStore: vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('@/api/operations', () => ({
  SESSIONS_QUERY: 'SESSIONS_QUERY',
  REVOKE_SESSION: 'REVOKE_SESSION',
  REVOKE_OTHER_SESSIONS: 'REVOKE_OTHER_SESSIONS'
}))

import { apolloClient } from '@/api/apollo'

const fakeSessions = [
  { id: 's1', current: true, device: 'Mac' },
  { id: 's2', current: false, device: 'iPhone' },
  { id: 's3', current: false, device: 'Old iPad' }
]

describe('sessions.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('starts empty', () => {
      const store = useSessionsStore()
      expect(store.sessions).toEqual([])
      expect(store.loading).toBe(false)
    })
  })

  describe('load()', () => {
    it('populates sessions on success', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { sessions: fakeSessions } })
      const store = useSessionsStore()
      await store.load()
      expect(store.sessions).toEqual(fakeSessions)
      expect(store.loading).toBe(false)
    })

    it('uses network-only fetch policy', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { sessions: [] } })
      const store = useSessionsStore()
      await store.load()

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ fetchPolicy: 'network-only' })
      )
    })

    it('resets loading even when the query rejects', async () => {
      apolloClient.query.mockRejectedValueOnce(new Error('load failed'))
      const store = useSessionsStore()
      await expect(store.load()).rejects.toThrow('load failed')
      expect(store.loading).toBe(false)
    })
  })

  describe('revoke()', () => {
    it('removes the matching session', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useSessionsStore()
      store.sessions = [...fakeSessions]
      await store.revoke('s2')
      expect(store.sessions).toHaveLength(2)
      expect(store.sessions.find(s => s.id === 's2')).toBeUndefined()
    })

    it('sends the right variables', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useSessionsStore()
      store.sessions = [...fakeSessions]
      await store.revoke('s2')

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 's2' } })
      )
    })
  })

  describe('revokeOthers()', () => {
    it('keeps only the current session', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useSessionsStore()
      store.sessions = [...fakeSessions]
      await store.revokeOthers()
      expect(store.sessions).toHaveLength(1)
      expect(store.sessions[0].id).toBe('s1')
      expect(store.sessions[0].current).toBe(true)
    })
  })
})
