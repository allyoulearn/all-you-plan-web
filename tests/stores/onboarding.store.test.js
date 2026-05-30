import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useOnboardingStore } from '@/stores/onboarding.store'

vi.mock('@/api/apollo', () => ({
  apolloClient: {
    query: vi.fn(),
    mutate: vi.fn(),
    clearStore: vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('@/api/operations', () => ({
  ONBOARDING_STATE_QUERY: 'ONBOARDING_STATE_QUERY',
  UPDATE_ONBOARDING: 'UPDATE_ONBOARDING',
  COMPLETE_ONBOARDING: 'COMPLETE_ONBOARDING',
  RESTART_ONBOARDING: 'RESTART_ONBOARDING'
}))

import { apolloClient } from '@/api/apollo'

const fakeState = {
  step: 2,
  tone: 'gentle',
  mode: 'solo',
  onboardedAt: null
}

describe('onboarding.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('starts with null state, computed defaults', () => {
      const store = useOnboardingStore()
      expect(store.state).toBeNull()
      expect(store.step).toBe(1)
      expect(store.tone).toBe('warm')
      expect(store.mode).toBeNull()
      expect(store.done).toBe(false)
      expect(store.loading).toBe(false)
    })
  })

  describe('computed', () => {
    it('reads step from state', () => {
      const store = useOnboardingStore()
      store.state = fakeState
      expect(store.step).toBe(2)
    })

    it('reads tone from state', () => {
      const store = useOnboardingStore()
      store.state = fakeState
      expect(store.tone).toBe('gentle')
    })

    it('reads mode from state', () => {
      const store = useOnboardingStore()
      store.state = fakeState
      expect(store.mode).toBe('solo')
    })

    it('done is true when onboardedAt is set', () => {
      const store = useOnboardingStore()
      store.state = { ...fakeState, onboardedAt: '2026-01-01' }
      expect(store.done).toBe(true)
    })
  })

  describe('load()', () => {
    it('populates state on success', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { onboardingState: fakeState } })
      const store = useOnboardingStore()
      await store.load()
      expect(store.state).toEqual(fakeState)
      expect(store.loading).toBe(false)
    })

    it('resets loading even on rejection', async () => {
      apolloClient.query.mockRejectedValueOnce(new Error('boom'))
      const store = useOnboardingStore()
      await expect(store.load()).rejects.toThrow('boom')
      expect(store.loading).toBe(false)
    })
  })

  describe('update()', () => {
    it('replaces state with mutation result', async () => {
      const next = { ...fakeState, step: 3 }
      apolloClient.mutate.mockResolvedValueOnce({ data: { updateOnboarding: next } })
      const store = useOnboardingStore()
      await store.update({ step: 3 })
      expect(store.state).toEqual(next)

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { input: { step: 3 } } })
      )
    })
  })

  describe('complete()', () => {
    it('replaces state with completion payload', async () => {
      const done = { ...fakeState, onboardedAt: '2026-05-25', step: 6 }
      apolloClient.mutate.mockResolvedValueOnce({ data: { completeOnboarding: done } })
      const store = useOnboardingStore()
      await store.complete()
      expect(store.state).toEqual(done)
      expect(store.done).toBe(true)
    })
  })

  describe('restart()', () => {
    it('resets onboardedAt + step locally', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useOnboardingStore()
      store.state = { ...fakeState, onboardedAt: '2026-01-01', step: 4 }
      await store.restart()
      expect(store.state.onboardedAt).toBeNull()
      expect(store.state.step).toBe(1)
    })

    it('handles a null pre-existing state by seeding fresh', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useOnboardingStore()
      store.state = null
      await store.restart()
      expect(store.state).toEqual({ onboardedAt: null, step: 1 })
    })
  })
})
