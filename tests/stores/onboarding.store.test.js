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

const toastError = vi.fn()

vi.mock('@/composables/useErrorToast', () => ({
  useErrorToast: () => ({ toastError, toastSuccess: vi.fn(), resolveErrorMessage: vi.fn() })
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

    it('captures error inline and resets loading on rejection (no throw)', async () => {
      apolloClient.query.mockRejectedValueOnce(new Error('boom'))
      const store = useOnboardingStore()
      await expect(store.load()).resolves.toBeUndefined()
      expect(store.error).toBe('boom')
      expect(store.loading).toBe(false)
    })

    it('clears a prior error on a subsequent successful load', async () => {
      const store = useOnboardingStore()
      apolloClient.query.mockRejectedValueOnce(new Error('boom'))
      await store.load()
      expect(store.error).toBe('boom')

      apolloClient.query.mockResolvedValueOnce({ data: { onboardingState: fakeState } })
      await store.load()
      expect(store.error).toBe('')
      expect(store.state).toEqual(fakeState)
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

    it('toasts and re-throws on failure, resetting loading', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('save failed'))
      const store = useOnboardingStore()
      await expect(store.update({ step: 3 })).rejects.toThrow('save failed')
      expect(toastError).toHaveBeenCalled()
      expect(store.loading).toBe(false)
    })

    // The wizard now runs 8 steps (daily-review at 5, calendar-sync at 6 were
    // added), so the store must forward the higher step transitions verbatim.
    it.each([6, 7, 8])('forwards the step-%i transition verbatim', async target => {
      const next = { ...fakeState, step: target }
      apolloClient.mutate.mockResolvedValueOnce({ data: { updateOnboarding: next } })
      const store = useOnboardingStore()
      await store.update({ step: target })

      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { input: { step: target } } })
      )

      expect(store.step).toBe(target)
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

    it('toasts and re-throws on failure, resetting loading', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('finish failed'))
      const store = useOnboardingStore()
      await expect(store.complete()).rejects.toThrow('finish failed')
      expect(toastError).toHaveBeenCalled()
      expect(store.loading).toBe(false)
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
