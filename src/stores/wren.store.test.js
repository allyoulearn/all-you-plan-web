import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWrenStore } from './wren.store'

vi.mock('@/api/apollo', () => ({
  apolloClient: {
    query: vi.fn(),
    mutate: vi.fn(),
  },
}))

vi.mock('@/api/operations', () => ({
  WREN_MESSAGES_QUERY: 'WREN_MESSAGES_QUERY',
  SEND_WREN_MESSAGE: 'SEND_WREN_MESSAGE',
}))

import { apolloClient } from '@/api/apollo'

const fakeMessages = [
  { id: 'm1', sender: 'coach', text: 'Hello!', actions: [], createdAt: '2026-05-21T08:00:00Z' },
]

const coachReply = {
  id: 'm2',
  sender: 'coach',
  text: 'Got it!',
  actions: ['Plan day', 'Skip'],
  createdAt: '2026-05-21T08:01:00Z',
}

describe('wren.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('load()', () => {
    it('fetches messages and populates the store', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { wrenMessages: fakeMessages } })
      const store = useWrenStore()
      await store.load()
      expect(store.messages).toEqual(fakeMessages)
      expect(store.error).toBe('')
    })

    it('sets error on failure', async () => {
      apolloClient.query.mockRejectedValueOnce(new Error('fetch failed'))
      const store = useWrenStore()
      await store.load()
      expect(store.error).toBe('fetch failed')
    })
  })

  describe('send()', () => {
    it('optimistically appends the user message before the mutation resolves', async () => {
      let resolvePromise
      apolloClient.mutate.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve
        }),
      )
      const store = useWrenStore()
      const promise = store.send('Hello Wren')

      // Before resolution — optimistic message should be present
      expect(store.messages).toHaveLength(1)
      expect(store.messages[0].sender).toBe('user')
      expect(store.messages[0].text).toBe('Hello Wren')

      resolvePromise({ data: { sendWrenMessage: coachReply } })
      await promise
    })

    it('appends the coach reply on success', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { sendWrenMessage: coachReply } })
      const store = useWrenStore()
      await store.send('Hello Wren')

      expect(store.messages).toHaveLength(2)
      expect(store.messages[1]).toEqual(coachReply)
    })

    it('the sending guard prevents a double-send', async () => {
      let resolveFirst
      apolloClient.mutate.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirst = resolve
        }),
      )
      const store = useWrenStore()
      const first = store.send('First')

      // Second send while first is in-flight should no-op
      await store.send('Second')
      expect(apolloClient.mutate).toHaveBeenCalledTimes(1)

      resolveFirst({ data: { sendWrenMessage: coachReply } })
      await first
    })

    it('empty string is a no-op', async () => {
      const store = useWrenStore()
      await store.send('')
      expect(apolloClient.mutate).not.toHaveBeenCalled()
      expect(store.messages).toHaveLength(0)
    })

    it('whitespace-only string is NOT treated as no-op (truthy)', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { sendWrenMessage: coachReply } })
      const store = useWrenStore()
      await store.send('   ')
      // The store only checks !text; a space string is truthy so the mutation fires
      expect(apolloClient.mutate).toHaveBeenCalledTimes(1)
    })

    it('removes the optimistic message on failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('send failed'))
      const store = useWrenStore()
      await store.send('Hi')

      expect(store.messages).toHaveLength(0)
      expect(store.error).toBe('send failed')
    })

    it('resets sending to false after failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('send failed'))
      const store = useWrenStore()
      await store.send('Hi')
      expect(store.sending).toBe(false)
    })
  })
})
