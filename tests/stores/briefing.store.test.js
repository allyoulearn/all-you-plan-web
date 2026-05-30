import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBriefingStore } from '@/stores/briefing.store'

vi.mock('@/api/apollo', () => ({
  apolloClient: {
    query: vi.fn(),
    mutate: vi.fn(),
    clearStore: vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('@/api/operations', () => ({
  TODAY_BRIEFING_QUERY: 'TODAY_BRIEFING_QUERY',
  REGENERATE_TODAY_BRIEFING: 'REGENERATE_TODAY_BRIEFING'
}))

import { apolloClient } from '@/api/apollo'

const fakeBriefing = {
  state: 'ready',
  greeting: 'Good morning, Ada',
  tone: 'warm',
  actions: [{ id: 'a1', label: 'Check inbox' }],
  generatedAt: '2026-05-25T07:00:00Z',
  expiresAt: '2026-05-25T19:00:00Z'
}

describe('briefing.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('starts with null briefing, no loading, no error', () => {
      const store = useBriefingStore()
      expect(store.briefing).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBe('')
    })
  })

  describe('load()', () => {
    it('populates briefing on success', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { todayBriefing: fakeBriefing } })
      const store = useBriefingStore()
      await store.load()
      expect(store.briefing).toEqual(fakeBriefing)
      expect(store.loading).toBe(false)
      expect(store.error).toBe('')
    })

    it('sends force=false by default', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { todayBriefing: fakeBriefing } })
      const store = useBriefingStore()
      await store.load()

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { force: false }, fetchPolicy: 'network-only' })
      )
    })

    it('forwards force=true when requested', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { todayBriefing: fakeBriefing } })
      const store = useBriefingStore()
      await store.load(true)

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { force: true } })
      )
    })

    it('sets a resting fallback briefing on failure and surfaces error', async () => {
      apolloClient.query.mockRejectedValueOnce(new Error('boom'))
      const store = useBriefingStore()
      await store.load()
      expect(store.error).toBe('boom')

      expect(store.briefing).toEqual({
        state: 'resting',
        greeting: '',
        tone: 'warm',
        actions: [],
        generatedAt: null,
        expiresAt: null
      })

      expect(store.loading).toBe(false)
    })
  })

  describe('regenerate()', () => {
    it('replaces briefing with mutation result on success', async () => {
      const fresh = { ...fakeBriefing, greeting: 'Take five' }
      apolloClient.mutate.mockResolvedValueOnce({ data: { regenerateTodayBriefing: fresh } })
      const store = useBriefingStore()
      await store.regenerate()
      expect(store.briefing).toEqual(fresh)
      expect(store.loading).toBe(false)
      expect(store.error).toBe('')
    })

    it('sets error on failure but leaves briefing untouched', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('regen failed'))
      const store = useBriefingStore()
      store.briefing = fakeBriefing
      await store.regenerate()
      expect(store.error).toBe('regen failed')
      expect(store.briefing).toEqual(fakeBriefing)
      expect(store.loading).toBe(false)
    })
  })
})
