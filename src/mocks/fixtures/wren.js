/** Mock fixtures for the Wren coach screen. */
import { Observable } from '@apollo/client/core'

const wrenMessages = [
  {
    id: 'wm1',
    sender: 'wren',
    text: 'Good morning. You have five tasks lined up today and your streak is at six days. What feels most important to protect?',
    actions: null,
    createdAt: '2026-05-22T06:00:00.000Z'
  },
  {
    id: 'wm2',
    sender: 'user',
    text: 'The mentor call prep. Everything else can slip but that cannot.',
    actions: null,
    createdAt: '2026-05-22T06:05:00.000Z'
  },
  {
    id: 'wm3',
    sender: 'wren',
    text: 'Solid priority. I will nudge you at 14:30 so you have 30 minutes to prepare before the call. Anything blocking you on the writing task?',
    actions: ['Set a reminder', 'Skip the nudge'],
    createdAt: '2026-05-22T06:05:30.000Z'
  },
  {
    id: 'wm4',
    sender: 'user',
    text: 'Not blocking, just procrastinating. I know what I need to write.',
    actions: null,
    createdAt: '2026-05-22T06:07:00.000Z'
  },
  {
    id: 'wm5',
    sender: 'wren',
    text: 'Then start with two sentences. Momentum usually takes care of the rest. You have got this.',
    actions: null,
    createdAt: '2026-05-22T06:07:30.000Z'
  }
]

const wrenConversation = {
  id: 'mock-conv-1',
  userId: 'mock-user-1',
  startedAt: '2026-05-22T06:00:00.000Z',
  closedAt: null
}

const wrenSettings = {
  displayName: null,
  tone: 'warm',
  enabled: true,
  dailyTurnCap: null
}

const wrenMemoryNotes = []

/**
 * Build a mocked WrenStream Observable that emits a couple of token deltas
 * followed by a complete event. Used by the mock link to validate the
 * streaming code path end-to-end in mock mode.
 * @returns {Observable<unknown>}
 */
function wrenStream() {
  return new Observable(observer => {
    const t1 = setTimeout(() => {
      observer.next({
        data: {
          wrenStream: {
            __typename: 'WrenTokenDelta',
            messageId: 'mock-msg',
            text: 'Hi from mock'
          }
        }
      })
    }, 10)
    const t2 = setTimeout(() => {
      observer.next({
        data: {
          wrenStream: {
            __typename: 'WrenComplete',
            message: {
              id: 'mock-msg',
              sender: 'coach',
              text: 'Hi from mock',
              status: 'complete',
              actions: [],
              createdAt: new Date().toISOString()
            }
          }
        }
      })
    }, 30)
    const t3 = setTimeout(() => observer.complete(), 50)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  })
}

export const registry = {
  wrenMessages: () => ({ wrenMessages }),
  wrenConversation: () => ({ wrenConversation }),
  wrenSettings: () => ({ wrenSettings }),
  wrenMemoryNotes: () => ({ wrenMemoryNotes }),
  sendWrenMessage: variables => ({
    sendWrenMessage: {
      id: 'wm-new',
      sender: 'wren',
      text: `Got it. You said: "${variables.text}". I am processing that now.`,
      actions: null,
      createdAt: new Date().toISOString()
    }
  }),
  updateWrenSettings: variables => ({
    updateWrenSettings: {
      displayName: variables.displayName ?? null,
      tone: variables.tone ?? 'warm',
      enabled: variables.enabled ?? true,
      dailyTurnCap: variables.dailyTurnCap ?? null
    }
  }),
  exportWrenConversation: variables => ({
    exportWrenConversation: {
      format: variables.format ?? 'markdown',
      filename: `wren-conversation.${variables.format === 'json' ? 'json' : 'md'}`,
      content:
        variables.format === 'json'
          ? JSON.stringify({ messages: wrenMessages }, null, 2)
          : wrenMessages.map(m => `**${m.sender}** (${m.createdAt}): ${m.text}`).join('\n\n')
    }
  }),
  // Subscription fixture: must return an Observable. The mock link forwards
  // its emissions to subscribers (multiple events before complete).
  wrenStream
}
