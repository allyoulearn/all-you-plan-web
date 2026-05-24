import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWrenStore } from '@/stores/wren.store'

vi.mock('@/api/apollo', () => ({
  apolloClient: {
    query: vi.fn(),
    mutate: vi.fn(),
    // send() opens a subscription before the mutation (so first stream events
    // aren't dropped). Tests don't exercise streaming via the link, so return
    // an observable-shaped object whose .subscribe() is a no-op.
    subscribe: vi.fn(() => ({ subscribe: () => ({ unsubscribe: () => {} }) }))
  }
}))

vi.mock('@/api/operations', () => ({
  WREN_MESSAGES_QUERY: 'WREN_MESSAGES_QUERY',
  WREN_CONVERSATION_QUERY: 'WREN_CONVERSATION_QUERY',
  SEND_WREN_MESSAGE: 'SEND_WREN_MESSAGE',
  WREN_STREAM_SUBSCRIPTION: 'WREN_STREAM_SUBSCRIPTION',
  UNDO_WREN_ACTION: 'UNDO_WREN_ACTION',
  CONFIRM_WREN_ACTION: 'CONFIRM_WREN_ACTION',
  CANCEL_WREN_ACTION: 'CANCEL_WREN_ACTION',
  WREN_SETTINGS_QUERY: 'WREN_SETTINGS_QUERY',
  UPDATE_WREN_SETTINGS: 'UPDATE_WREN_SETTINGS',
  EXPORT_WREN_CONVERSATION: 'EXPORT_WREN_CONVERSATION'
}))

const mockToastError = vi.fn()
vi.mock('@/composables/useErrorToast', () => ({
  useErrorToast: () => ({ toastError: mockToastError, toastSuccess: vi.fn() })
}))

import { apolloClient } from '@/api/apollo'

const fakeMessages = [
  { id: 'm1', sender: 'coach', text: 'Hello!', actions: [], createdAt: '2026-05-21T08:00:00Z' }
]

const coachReply = {
  id: 'm2',
  sender: 'coach',
  text: 'Got it!',
  actions: ['Plan day', 'Skip'],
  createdAt: '2026-05-21T08:01:00Z'
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
        new Promise(resolve => {
          resolvePromise = resolve
        })
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
        new Promise(resolve => {
          resolveFirst = resolve
        })
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

    it('whitespace-only string IS a no-op after trim (WEB-W1-18)', async () => {
      const store = useWrenStore()
      await store.send('   ')
      // Post-fix: the store trims and rejects whitespace-only so no noise
      // message ever reaches the API.
      expect(apolloClient.mutate).not.toHaveBeenCalled()
      expect(store.messages).toHaveLength(0)
    })

    it('trims surrounding whitespace before sending (WEB-W1-18)', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { sendWrenMessage: coachReply } })
      const store = useWrenStore()
      await store.send('   hello   ')
      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { text: 'hello' } })
      )
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

    it('shows error toast on failure (WEB-T05-009)', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('send failed'))
      const store = useWrenStore()
      await store.send('Hi')

      expect(mockToastError).toHaveBeenCalledWith(expect.any(Error), 'Failed to send message')
    })

    it('clears a stale error before running (WEB-W1-05)', async () => {
      // send() now resolves the conversationId via WREN_CONVERSATION_QUERY
      // before mutating, so we mock both the query (for conversationId) and
      // the mutation (for the coach reply).
      apolloClient.query.mockResolvedValueOnce({ data: { wrenConversation: { id: 'c1' } } })
      apolloClient.mutate.mockResolvedValueOnce({ data: { sendWrenMessage: coachReply } })
      const store = useWrenStore()
      store.error = 'stale'
      await store.send('hi')
      expect(store.error).toBe('')
    })

    it('opens the stream subscription on the first send and reuses it on later sends', async () => {
      apolloClient.query.mockResolvedValueOnce({ data: { wrenConversation: { id: 'c1' } } })
      apolloClient.mutate.mockResolvedValue({ data: { sendWrenMessage: coachReply } })
      const store = useWrenStore()

      await store.send('first')
      expect(apolloClient.subscribe).toHaveBeenCalledTimes(1)
      expect(apolloClient.subscribe).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { conversationId: 'c1' } })
      )

      // Second send: subscription already active, conversationId cached.
      await store.send('second')
      expect(apolloClient.subscribe).toHaveBeenCalledTimes(1)
      // ensureConversation cached the id, so only the first query was used.
      expect(apolloClient.query).toHaveBeenCalledTimes(1)
    })

    it('routes subscription events into applyStreamEvent (token delta path)', async () => {
      // Wire a real callback through the subscribe stub so emitting an event
      // exercises the next handler.
      let nextCb
      apolloClient.subscribe.mockReturnValueOnce({
        subscribe: ({ next }) => {
          nextCb = next
          return { unsubscribe: () => {} }
        }
      })
      apolloClient.query.mockResolvedValueOnce({ data: { wrenConversation: { id: 'c1' } } })
      apolloClient.mutate.mockResolvedValueOnce({
        data: {
          sendWrenMessage: {
            id: 'cm1',
            sender: 'coach',
            text: '',
            actions: [],
            status: 'streaming',
            createdAt: ''
          }
        }
      })
      const store = useWrenStore()
      await store.send('hi')
      nextCb({
        data: { wrenStream: { __typename: 'WrenTokenDelta', messageId: 'cm1', text: 'hello' } }
      })
      const coachMsg = store.messages.find(m => m.id === 'cm1')
      expect(coachMsg.text).toBe('hello')
    })

    it('sets error.value when the subscription onError fires', async () => {
      let errCb
      apolloClient.subscribe.mockReturnValueOnce({
        subscribe: ({ error }) => {
          errCb = error
          return { unsubscribe: () => {} }
        }
      })
      apolloClient.query.mockResolvedValueOnce({ data: { wrenConversation: { id: 'c1' } } })
      apolloClient.mutate.mockResolvedValueOnce({ data: { sendWrenMessage: coachReply } })
      const store = useWrenStore()
      await store.send('hi')
      errCb(new Error('socket dropped'))
      expect(store.error).toBe('socket dropped')
    })

    it('does not open a subscription when ensureConversation fails', async () => {
      apolloClient.query.mockRejectedValueOnce(new Error('no conversation'))
      apolloClient.mutate.mockResolvedValueOnce({ data: { sendWrenMessage: coachReply } })
      const store = useWrenStore()
      await store.send('hi')
      expect(apolloClient.subscribe).not.toHaveBeenCalled()
      // The mutation still happened (legacy/scripted path can survive without a stream).
      expect(apolloClient.mutate).toHaveBeenCalledTimes(1)
    })
  })
})

// ── Action mutations (undo/confirm/cancel) ────────────────────────────────────

describe('useWrenStore — action mutations', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('undo()', () => {
    it('returns true when the mutation resolves with true', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { undoWrenAction: true } })
      const store = useWrenStore()
      const ok = await store.undo('u1')
      expect(ok).toBe(true)
      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { undoToken: 'u1' } })
      )
    })

    it('returns false when the mutation resolves with false', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { undoWrenAction: false } })
      const store = useWrenStore()
      const ok = await store.undo('u1')
      expect(ok).toBe(false)
    })

    it('returns false and toasts on error', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('undo failed'))
      const store = useWrenStore()
      const ok = await store.undo('u1')
      expect(ok).toBe(false)
      expect(mockToastError).toHaveBeenCalledWith(expect.any(Error), 'Undo failed')
    })
  })

  describe('confirm()', () => {
    it('returns the applied action on success', async () => {
      const applied = { kind: 'task.deleted', summary: 'X', undoToken: null, undoExpiresAt: null }
      apolloClient.mutate.mockResolvedValueOnce({ data: { confirmWrenAction: applied } })
      const store = useWrenStore()
      const res = await store.confirm('ct1')
      expect(res).toEqual(applied)
      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { confirmToken: 'ct1' } })
      )
    })

    it('returns null and toasts on error', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('confirm failed'))
      const store = useWrenStore()
      const res = await store.confirm('ct1')
      expect(res).toBeNull()
      expect(mockToastError).toHaveBeenCalledWith(expect.any(Error), 'Confirmation failed')
    })
  })

  describe('cancel()', () => {
    it('returns true when the mutation resolves with true', async () => {
      apolloClient.mutate.mockResolvedValueOnce({ data: { cancelWrenAction: true } })
      const store = useWrenStore()
      const ok = await store.cancel('ct1')
      expect(ok).toBe(true)
    })

    it('returns false and toasts on error', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('cancel failed'))
      const store = useWrenStore()
      const ok = await store.cancel('ct1')
      expect(ok).toBe(false)
      expect(mockToastError).toHaveBeenCalledWith(expect.any(Error), 'Cancel failed')
    })
  })
})

// ── Settings + export ─────────────────────────────────────────────────────────

describe('useWrenStore — settings + export', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loadSettings: populates settings on success', async () => {
    apolloClient.query.mockResolvedValueOnce({
      data: {
        wrenSettings: { displayName: 'Lucas', tone: 'direct', enabled: true, dailyTurnCap: 50 }
      }
    })
    const store = useWrenStore()
    await store.loadSettings()
    expect(store.settings).toMatchObject({ displayName: 'Lucas', tone: 'direct' })
  })

  it('loadSettings: sets error on failure', async () => {
    apolloClient.query.mockRejectedValueOnce(new Error('settings down'))
    const store = useWrenStore()
    await store.loadSettings()
    expect(store.error).toBe('settings down')
  })

  it('updateSettings: persists patch + returns the new settings', async () => {
    const next = { displayName: null, tone: 'warm', enabled: true, dailyTurnCap: null }
    apolloClient.mutate.mockResolvedValueOnce({ data: { updateWrenSettings: next } })
    const store = useWrenStore()
    const res = await store.updateSettings({ displayName: null })
    expect(res).toEqual(next)
    expect(store.settings).toEqual(next)
    expect(apolloClient.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { displayName: null } })
    )
  })

  it('updateSettings: forwards null explicitly so the API can clear a field', async () => {
    apolloClient.mutate.mockResolvedValueOnce({
      data: {
        updateWrenSettings: { displayName: null, tone: 'warm', enabled: true, dailyTurnCap: null }
      }
    })
    const store = useWrenStore()
    await store.updateSettings({ displayName: null, dailyTurnCap: null })
    const variables = apolloClient.mutate.mock.calls[0][0].variables
    expect(variables.displayName).toBeNull()
    expect(variables.dailyTurnCap).toBeNull()
  })

  it('updateSettings: returns null on error and sets error', async () => {
    apolloClient.mutate.mockRejectedValueOnce(new Error('save failed'))
    const store = useWrenStore()
    const res = await store.updateSettings({ tone: 'warm' })
    expect(res).toBeNull()
    expect(store.error).toBe('save failed')
  })

  it('exportConversation: returns the export payload', async () => {
    apolloClient.query.mockResolvedValueOnce({
      data: { exportWrenConversation: { format: 'markdown', filename: 'x.md', content: '# hi' } }
    })
    const store = useWrenStore()
    const res = await store.exportConversation('markdown')
    expect(res).toMatchObject({ format: 'markdown', filename: 'x.md' })
  })

  it('exportConversation: propagates errors to the caller (no internal toast)', async () => {
    apolloClient.query.mockRejectedValueOnce(new Error('export down'))
    const store = useWrenStore()
    await expect(store.exportConversation('markdown')).rejects.toThrow('export down')
    expect(mockToastError).not.toHaveBeenCalled()
  })
})

describe('useWrenStore — streaming events', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('appends token deltas to the placeholder coach message text', () => {
    const store = useWrenStore()
    store.messages = [
      { id: 'p1', sender: 'coach', text: '', actions: [], status: 'streaming', createdAt: '' }
    ]
    store.applyStreamEvent({ __typename: 'WrenTokenDelta', messageId: 'p1', text: 'hi ' })
    store.applyStreamEvent({ __typename: 'WrenTokenDelta', messageId: 'p1', text: 'there' })
    expect(store.messages[0].text).toBe('hi there')
  })

  it('inserts a pending action chip on WrenActionStarted', () => {
    const store = useWrenStore()
    store.messages = [
      { id: 'p1', sender: 'coach', text: '', actions: [], status: 'streaming', createdAt: '' }
    ]
    store.applyStreamEvent({
      __typename: 'WrenActionStarted',
      messageId: 'p1',
      tempId: 't1',
      kind: 'task.creating',
      summary: 'Adding task…'
    })
    expect(store.messages[0].actions).toHaveLength(1)
    expect(store.messages[0].actions[0]).toMatchObject({
      __typename: 'WrenAppliedAction',
      kind: 'task.creating',
      summary: 'Adding task…',
      tempId: 't1',
      pending: true
    })
  })

  it('reconciles a pending chip with WrenActionEvent (matched by tempId)', () => {
    const store = useWrenStore()
    store.messages = [
      {
        id: 'p1',
        sender: 'coach',
        text: '',
        actions: [
          {
            __typename: 'WrenAppliedAction',
            kind: 'task.creating',
            summary: 'Adding task…',
            tempId: 't1',
            pending: true
          }
        ],
        status: 'streaming',
        createdAt: ''
      }
    ]
    store.applyStreamEvent({
      __typename: 'WrenActionEvent',
      messageId: 'p1',
      tempId: 't1',
      action: {
        __typename: 'WrenAppliedAction',
        kind: 'task.created',
        summary: 'Added "X"',
        refType: 'task',
        refId: 'abc',
        undoToken: 'u1',
        undoExpiresAt: '2030-05-23T00:01:00Z'
      }
    })
    expect(store.messages[0].actions).toHaveLength(1)
    expect(store.messages[0].actions[0]).toMatchObject({
      kind: 'task.created',
      summary: 'Added "X"',
      undoToken: 'u1'
    })
  })

  it('appends a pending-confirmation chip on WrenPendingConfirmationEvent', () => {
    const store = useWrenStore()
    store.messages = [
      { id: 'p1', sender: 'coach', text: '', actions: [], status: 'streaming', createdAt: '' }
    ]
    store.applyStreamEvent({
      __typename: 'WrenPendingConfirmationEvent',
      messageId: 'p1',
      confirmToken: 'ct1',
      tool: 'deleteTask',
      summary: 'Delete "X"?',
      refType: 'task',
      refId: 'abc',
      expiresAt: '2030-05-23T00:05:00Z'
    })
    expect(store.messages[0].actions).toHaveLength(1)
    expect(store.messages[0].actions[0]).toMatchObject({
      __typename: 'WrenPendingConfirmation',
      confirmToken: 'ct1',
      summary: 'Delete "X"?'
    })
  })

  it('replaces placeholder with final message on WrenComplete', () => {
    const store = useWrenStore()
    store.messages = [
      {
        id: 'p1',
        sender: 'coach',
        text: 'partial',
        actions: [],
        status: 'streaming',
        createdAt: ''
      }
    ]
    store.applyStreamEvent({
      __typename: 'WrenComplete',
      message: {
        id: 'p1',
        sender: 'coach',
        text: 'partial complete',
        actions: [],
        status: 'complete',
        createdAt: '2026-05-23T00:01:00Z'
      }
    })
    expect(store.messages[0].status).toBe('complete')
    expect(store.messages[0].text).toBe('partial complete')
  })

  it('appends a final message on WrenComplete when the placeholder is not yet present (mutation-vs-subscription race)', () => {
    const store = useWrenStore()
    store.messages = []
    store.applyStreamEvent({
      __typename: 'WrenComplete',
      message: {
        id: 'p1',
        sender: 'coach',
        text: 'arrived first',
        actions: [],
        status: 'complete',
        createdAt: '2026-05-23T00:01:00Z'
      }
    })
    expect(store.messages).toHaveLength(1)
    expect(store.messages[0].id).toBe('p1')
    expect(store.messages[0].status).toBe('complete')
  })

  it('drops token-delta events for unknown messages (no placeholder yet)', () => {
    const store = useWrenStore()
    store.messages = []
    // No placeholder for 'p1' yet — event should be a no-op, not throw.
    store.applyStreamEvent({ __typename: 'WrenTokenDelta', messageId: 'p1', text: 'lost' })
    expect(store.messages).toEqual([])
  })

  it('WrenError without a placeholder still sets error.value', () => {
    const store = useWrenStore()
    store.messages = []
    store.applyStreamEvent({
      __typename: 'WrenError',
      messageId: null,
      code: 'PROVIDER_DOWN',
      message: 'down'
    })
    expect(store.error).toMatch(/PROVIDER_DOWN/)
    expect(store.messages).toEqual([])
  })

  it('WrenActionEvent appends a chip if no tempId is provided', () => {
    const store = useWrenStore()
    store.messages = [
      { id: 'p1', sender: 'coach', text: '', actions: [], status: 'streaming', createdAt: '' }
    ]
    store.applyStreamEvent({
      __typename: 'WrenActionEvent',
      messageId: 'p1',
      tempId: null,
      action: {
        __typename: 'WrenAppliedAction',
        kind: 'task.created',
        summary: 'Added "Y"',
        undoToken: 'u2',
        undoExpiresAt: '2030-05-23T00:00:00Z'
      }
    })
    expect(store.messages[0].actions).toHaveLength(1)
    expect(store.messages[0].actions[0]).toMatchObject({ summary: 'Added "Y"', undoToken: 'u2' })
  })

  it('WrenConfirmationResolvedEvent (confirmed + action) upgrades the chip to applied', () => {
    const store = useWrenStore()
    store.messages = [
      {
        id: 'p1',
        sender: 'coach',
        text: '',
        actions: [
          {
            __typename: 'WrenPendingConfirmation',
            confirmToken: 'ct1',
            summary: 'Delete?'
          }
        ],
        status: 'streaming',
        createdAt: ''
      }
    ]
    store.applyStreamEvent({
      __typename: 'WrenConfirmationResolvedEvent',
      messageId: 'p1',
      confirmToken: 'ct1',
      resolution: 'confirmed',
      action: {
        kind: 'task.deleted',
        summary: 'Deleted "X"',
        undoToken: 'u3',
        undoExpiresAt: '2030-05-23T00:00:00Z'
      }
    })
    expect(store.messages[0].actions[0].__typename).toBe('WrenAppliedAction')
    expect(store.messages[0].actions[0].summary).toBe('Deleted "X"')
  })

  it('WrenConfirmationResolvedEvent (cancelled) marks the existing chip resolved without losing fields', () => {
    const store = useWrenStore()
    store.messages = [
      {
        id: 'p1',
        sender: 'coach',
        text: '',
        actions: [
          {
            __typename: 'WrenPendingConfirmation',
            confirmToken: 'ct1',
            summary: 'Delete?'
          }
        ],
        status: 'streaming',
        createdAt: ''
      }
    ]
    store.applyStreamEvent({
      __typename: 'WrenConfirmationResolvedEvent',
      messageId: 'p1',
      confirmToken: 'ct1',
      resolution: 'cancelled',
      action: null
    })
    expect(store.messages[0].actions[0].resolution).toBe('cancelled')
    expect(store.messages[0].actions[0].summary).toBe('Delete?')
  })

  it('marks message failed on WrenError', () => {
    const store = useWrenStore()
    store.messages = [
      { id: 'p1', sender: 'coach', text: '', actions: [], status: 'streaming', createdAt: '' }
    ]
    store.applyStreamEvent({
      __typename: 'WrenError',
      messageId: 'p1',
      code: 'PROVIDER_DOWN',
      errorMessage: 'oops'
    })
    expect(store.messages[0].status).toBe('failed')
    expect(store.error).toMatch(/PROVIDER_DOWN|oops/i)
  })

  it('WrenError shows a toast so the user sees it (no view renders store.error)', () => {
    const store = useWrenStore()
    store.messages = []
    store.applyStreamEvent({
      __typename: 'WrenError',
      messageId: null,
      code: 'NETWORK',
      errorMessage: 'dropped'
    })
    expect(mockToastError).toHaveBeenCalledWith(expect.any(Error), 'Wren stream error')
  })
})

describe('useWrenStore — reset()', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('clears all per-conversation state so re-login starts fresh (WEB-W4-26)', () => {
    const store = useWrenStore()
    store.messages = [{ id: 'm1', sender: 'user', text: 'x', actions: [], createdAt: '' }]
    store.settings = { tone: 'warm', enabled: true, dailyTurnCap: null, displayName: 'old' }
    store.conversationId = 'cached-conv'
    store.error = 'stale'
    store.loading = true
    store.sending = true

    store.reset()

    expect(store.messages).toEqual([])
    expect(store.settings).toBeNull()
    expect(store.conversationId).toBeNull()
    expect(store.error).toBe('')
    expect(store.loading).toBe(false)
    expect(store.sending).toBe(false)
  })

  it('reset() unsubscribes any active subscription via teardown', () => {
    const store = useWrenStore()
    const unsub = vi.fn()
    // Simulate an active subscription by stubbing apolloClient.subscribe to
    // return an observable whose subscribe returns our unsubscribe spy.
    apolloClient.subscribe.mockReturnValueOnce({
      subscribe: () => ({ unsubscribe: unsub })
    })
    apolloClient.query.mockResolvedValueOnce({ data: { wrenConversation: { id: 'c1' } } })
    apolloClient.mutate.mockResolvedValueOnce({ data: { sendWrenMessage: coachReply } })

    return store.send('hi').then(() => {
      store.reset()
      expect(unsub).toHaveBeenCalled()
    })
  })
})

// ── Stream watchdog ───────────────────────────────────────────────────────────
//
// Every incremental stream event on a 'streaming' placeholder arms a 30s
// timer; WrenComplete / WrenError / reset() clear it. If the timer fires the
// message flips to 'interrupted' and a toast surfaces.

describe('useWrenStore — stream watchdog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  function streamingPlaceholder(id = 'p1') {
    return { id, sender: 'coach', text: '', actions: [], status: 'streaming', createdAt: '' }
  }

  it('resets the window when a delta arrives within the timeout', () => {
    vi.useFakeTimers()
    try {
      const store = useWrenStore()
      store.messages = [streamingPlaceholder()]

      store.applyStreamEvent({ __typename: 'WrenTokenDelta', messageId: 'p1', text: 'hi ' })
      // 29s later — still under the threshold (default 30s).
      vi.advanceTimersByTime(29_000)
      store.applyStreamEvent({ __typename: 'WrenTokenDelta', messageId: 'p1', text: 'there' })

      expect(store.messages[0].status).toBe('streaming')
      expect(store.messages[0].text).toBe('hi there')
      expect(store.error).toBe('')
      expect(mockToastError).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('flips to interrupted + sets error + toasts when the watchdog fires', () => {
    vi.useFakeTimers()
    try {
      const store = useWrenStore()
      store.messages = [streamingPlaceholder()]
      store.applyStreamEvent({ __typename: 'WrenTokenDelta', messageId: 'p1', text: 'hi' })

      // 31s of silence — watchdog fires at 30s.
      vi.advanceTimersByTime(31_000)

      expect(store.messages[0].status).toBe('interrupted')
      expect(store.messages[0].text).toBe('hi') // partial preserved
      expect(store.error).toMatch(/interrupted/i)
      expect(mockToastError).toHaveBeenCalledWith(expect.any(Error), 'Wren stream interrupted')
    } finally {
      vi.useRealTimers()
    }
  })

  it('WrenComplete cancels the watchdog so a late timer is a no-op', () => {
    vi.useFakeTimers()
    try {
      const store = useWrenStore()
      store.messages = [streamingPlaceholder()]
      store.applyStreamEvent({ __typename: 'WrenTokenDelta', messageId: 'p1', text: 'hi ' })

      store.applyStreamEvent({
        __typename: 'WrenComplete',
        message: {
          id: 'p1',
          sender: 'coach',
          text: 'hi there',
          actions: [],
          status: 'complete',
          createdAt: ''
        }
      })

      // 60s later — long past the threshold but the timer was cleared so
      // status must remain 'complete' and no toast surfaces.
      vi.advanceTimersByTime(60_000)

      expect(store.messages[0].status).toBe('complete')
      expect(mockToastError).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('WrenError cancels the watchdog (message stays failed, not overwritten to interrupted)', () => {
    vi.useFakeTimers()
    try {
      const store = useWrenStore()
      store.messages = [streamingPlaceholder()]
      store.applyStreamEvent({ __typename: 'WrenTokenDelta', messageId: 'p1', text: 'hi' })

      store.applyStreamEvent({
        __typename: 'WrenError',
        messageId: 'p1',
        code: 'PROVIDER_DOWN',
        message: 'down'
      })
      expect(store.messages[0].status).toBe('failed')

      // Drain time well past the threshold — status must not flip.
      vi.advanceTimersByTime(60_000)
      expect(store.messages[0].status).toBe('failed')
    } finally {
      vi.useRealTimers()
    }
  })

  it('WrenActionEvent on a streaming message also re-arms the watchdog', () => {
    vi.useFakeTimers()
    try {
      const store = useWrenStore()
      store.messages = [streamingPlaceholder()]
      store.applyStreamEvent({ __typename: 'WrenTokenDelta', messageId: 'p1', text: 'hi' })

      vi.advanceTimersByTime(20_000)
      // Action event with no tempId — still counts as activity.
      store.applyStreamEvent({
        __typename: 'WrenActionEvent',
        messageId: 'p1',
        tempId: null,
        action: { summary: 'Added X', undoToken: null, undoExpiresAt: null }
      })
      vi.advanceTimersByTime(20_000) // total 40s but only 20s since action event

      expect(store.messages[0].status).toBe('streaming')
      expect(mockToastError).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('reset() cancels all pending watchdogs so they cannot fire post-reset', () => {
    vi.useFakeTimers()
    try {
      const store = useWrenStore()
      store.messages = [streamingPlaceholder('p1'), streamingPlaceholder('p2')]
      store.applyStreamEvent({ __typename: 'WrenTokenDelta', messageId: 'p1', text: 'a' })
      store.applyStreamEvent({ __typename: 'WrenTokenDelta', messageId: 'p2', text: 'b' })

      store.reset()

      // Past the threshold — neither timer should fire on a reset store.
      vi.advanceTimersByTime(60_000)
      expect(store.messages).toEqual([])
      expect(mockToastError).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not arm the watchdog for a message that is not in streaming state', () => {
    vi.useFakeTimers()
    try {
      const store = useWrenStore()
      // Placeholder already 'complete' — incoming late delta should not
      // resurrect a watchdog window. (Defensive: this guards against a stray
      // event for a finalised message overwriting status downstream.)
      store.messages = [
        { id: 'p1', sender: 'coach', text: 'done', actions: [], status: 'complete', createdAt: '' }
      ]
      store.applyStreamEvent({ __typename: 'WrenTokenDelta', messageId: 'p1', text: 'late' })
      vi.advanceTimersByTime(60_000)

      // Status unchanged, no toast.
      expect(store.messages[0].status).toBe('complete')
      expect(mockToastError).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })
})
