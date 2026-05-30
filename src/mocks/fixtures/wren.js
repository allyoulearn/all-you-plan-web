/** Mock fixtures for the Wren coach screen. */
import { Observable } from '@apollo/client/core'

// Sender values mirror the WrenSender enum in the API schema:
// `coach | user`. Earlier fixtures used `'wren'` which never matched the
// enum — the bubble defaulted to the coach branch because the WrenBubble
// template only special-cases `sender === 'user'`. Aligning the values
// here makes the mock data trustworthy for schema-shape assertions.
//
// Every object that the WrenMessages query touches MUST carry __typename.
// `actions` is `[WrenAction!]!` (a union), and the query explicitly selects
// `__typename` inside inline fragments — without it, Apollo's InMemoryCache
// drops the parent message, leaving the UI with empty bubbles.
// The active "Today's planning" thread spans three days so the sticky
// day-divider in the chat view has multiple labels to swap between as the
// user scrolls back through history. Day-by-day breakdown:
//   2026-05-25 — wm1–wm9: setup conversation Sunday evening
//   2026-05-26 — wm10–wm21: writing-task day + inbox triage + walk
//   2026-05-27 — wm22–wm29: mentor-call prep (today)
const wrenMessages = [
  {
    __typename: 'WrenMessage',
    id: 'wm1',
    sender: 'coach',
    text: 'Good evening. I have your week mapped. The mentor call is Wednesday — want to lock the prep slot now so it does not get crowded out?',
    actions: [
      { __typename: 'WrenSuggestedAction', label: 'Lock the prep slot' },
      { __typename: 'WrenSuggestedAction', label: 'Decide tomorrow' }
    ],
    status: 'complete',
    createdAt: '2026-05-25T18:00:00.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm2',
    sender: 'user',
    text: 'Lock it. The mentor call is the only thing this week I cannot afford to wing.',
    actions: [],
    status: 'complete',
    createdAt: '2026-05-25T18:05:00.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm3',
    sender: 'coach',
    text: 'Done. Wednesday 14:00–15:00 is now blocked for prep. I will nudge you at 13:30 so you have 30 minutes to settle in before the call.',
    actions: [],
    status: 'complete',
    createdAt: '2026-05-25T18:05:30.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm4',
    sender: 'user',
    text: 'Good. What else is on the radar this week?',
    actions: [],
    status: 'complete',
    createdAt: '2026-05-25T18:07:00.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm5',
    sender: 'coach',
    text: 'Three real items besides the call. The pricing-page rewrite (Monday), the writing task you have been pushing (Tuesday), and a coffee with Sam (Thursday). Want me to flag anything as optional?',
    actions: [
      { __typename: 'WrenSuggestedAction', label: 'Mark coffee optional' },
      { __typename: 'WrenSuggestedAction', label: 'Keep all four' }
    ],
    status: 'complete',
    createdAt: '2026-05-25T18:08:00.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm6',
    sender: 'user',
    text: 'Keep all four. I have been ducking Sam for two weeks.',
    actions: [],
    status: 'complete',
    createdAt: '2026-05-25T18:09:00.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm7',
    sender: 'coach',
    text: 'Noted. Two final things while we are here. Your streak is at six days — protect tomorrow morning and it becomes a habit, not a run. And the writing task is the one most likely to slip. Should I add a guardrail?',
    actions: [
      { __typename: 'WrenSuggestedAction', label: 'Add a guardrail' },
      { __typename: 'WrenSuggestedAction', label: 'No guardrail' }
    ],
    status: 'complete',
    createdAt: '2026-05-25T18:10:30.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm8',
    sender: 'user',
    text: 'Add it. If I have not started by 11 tomorrow, ping me.',
    actions: [],
    status: 'complete',
    createdAt: '2026-05-25T18:11:00.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm9',
    sender: 'coach',
    text: 'Guardrail set for 11:00 tomorrow. Get a real Sunday — I will see you in the morning.',
    actions: [],
    status: 'complete',
    createdAt: '2026-05-25T18:11:30.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm10',
    sender: 'coach',
    text: 'Good morning. The writing task is the only thing the day really needs. Anything blocking you?',
    actions: [],
    status: 'complete',
    createdAt: '2026-05-26T08:30:00.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm11',
    sender: 'user',
    text: 'Not blocking, just procrastinating. I know what I need to write.',
    actions: [],
    status: 'complete',
    createdAt: '2026-05-26T08:32:00.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm12',
    sender: 'coach',
    text: 'Then start with two sentences. Momentum usually takes care of the rest. You have got this.',
    actions: [],
    status: 'complete',
    createdAt: '2026-05-26T08:32:30.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm13',
    sender: 'user',
    text: 'OK, draft sent. Felt easier than expected once I started.',
    actions: [],
    status: 'complete',
    createdAt: '2026-05-26T10:32:00.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm14',
    sender: 'coach',
    text: 'That is the pattern. The starting cost is almost always larger than the thing itself. Want me to log a note so we can revisit this when you stall next?',
    actions: [
      { __typename: 'WrenSuggestedAction', label: 'Log the insight' },
      { __typename: 'WrenSuggestedAction', label: 'Maybe later' }
    ],
    status: 'complete',
    createdAt: '2026-05-26T10:33:00.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm15',
    sender: 'user',
    text: 'Yes, log it. I want to see this pattern when I doubt myself.',
    actions: [],
    status: 'complete',
    createdAt: '2026-05-26T10:34:00.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm16',
    sender: 'coach',
    text: 'Logged under "starting costs". I will surface it the next time you say a task feels heavier than it should. What is next on your list?',
    actions: [],
    status: 'complete',
    createdAt: '2026-05-26T10:34:30.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm17',
    sender: 'user',
    text: 'Inbox triage. I am dreading it.',
    actions: [],
    status: 'complete',
    createdAt: '2026-05-26T14:00:00.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm18',
    sender: 'coach',
    text: 'Three rules for the next 20 minutes. Reply only if it takes under two minutes. Snooze anything tied to a person, not a thing. Delete the rest without guilt. Want me to start a 20-minute timer?',
    actions: [
      { __typename: 'WrenSuggestedAction', label: 'Start 20-min timer' },
      { __typename: 'WrenSuggestedAction', label: 'Skip the timer' }
    ],
    status: 'complete',
    createdAt: '2026-05-26T14:01:00.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm19',
    sender: 'user',
    text: 'Done. 47 down to 12. Most of it was noise.',
    actions: [],
    status: 'complete',
    createdAt: '2026-05-26T14:23:00.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm20',
    sender: 'coach',
    text: 'Beautiful clean-out. The remaining 12 sound like actual signal. Want me to convert any of them into tasks for tomorrow, or leave them for after the call?',
    actions: [
      { __typename: 'WrenSuggestedAction', label: 'Convert urgent ones' },
      { __typename: 'WrenSuggestedAction', label: 'Leave for later' }
    ],
    status: 'complete',
    createdAt: '2026-05-26T14:24:00.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm21',
    sender: 'user',
    text: 'Leave for later. I want a clear head tomorrow.',
    actions: [],
    status: 'complete',
    createdAt: '2026-05-26T14:25:00.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm22',
    sender: 'user',
    text: 'Going into prep mode. The walk reset my head.',
    actions: [],
    status: 'complete',
    createdAt: '2026-05-27T08:51:00.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm23',
    sender: 'coach',
    text: 'Welcome back. Three things I would surface from your last mentor call notes: you wanted to ask about pricing leverage, you owe them an update on the launch, and you parked the team-structure question. Anything you want to lead with?',
    actions: [],
    status: 'complete',
    createdAt: '2026-05-27T08:52:00.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm24',
    sender: 'user',
    text: 'Launch update first, then pricing. Save the team thing for next time if we run short.',
    actions: [],
    status: 'complete',
    createdAt: '2026-05-27T08:53:00.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm25',
    sender: 'coach',
    text: 'Sensible ordering. Lead with momentum, ask for leverage, defer what is not time-critical. Want me to draft a one-page brief you can glance at during the call?',
    actions: [
      { __typename: 'WrenSuggestedAction', label: 'Draft the brief' },
      { __typename: 'WrenSuggestedAction', label: 'I have got it' }
    ],
    status: 'complete',
    createdAt: '2026-05-27T08:53:30.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm26',
    sender: 'user',
    text: 'Draft it. I want something on the screen, not in my head.',
    actions: [],
    status: 'complete',
    createdAt: '2026-05-27T08:54:00.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm27',
    sender: 'coach',
    text: 'Drafted. Three bullets per topic, named outcomes, and one question that lands the conversation. It is in your prep doc. You have 35 minutes before the nudge.',
    actions: [],
    status: 'complete',
    createdAt: '2026-05-27T08:55:00.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm28',
    sender: 'user',
    text: 'Reading it now. This is exactly what I needed.',
    actions: [],
    status: 'complete',
    createdAt: '2026-05-27T08:56:00.000Z'
  },
  {
    __typename: 'WrenMessage',
    id: 'wm29',
    sender: 'coach',
    text: 'That is the rhythm. Prepare loudly, perform quietly. I will be here when the call ends. Good luck.',
    actions: [],
    status: 'complete',
    createdAt: '2026-05-27T08:56:30.000Z'
  }
]

// Conversation list shown in the WrenView left rail. The "Today's planning"
// thread is the active one matching `wrenMessages` above; the others have
// their own message histories below so switching feels real.
const wrenConversations = [
  {
    __typename: 'WrenConversationSummary',
    id: 'conv-today',
    title: "Today's planning",
    preview: 'Prepare loudly, perform quietly. I will be here when the call ends. Good luck.',
    updatedAt: '2026-05-27T08:56:30.000Z',
    messageCount: wrenMessages.length
  },
  {
    __typename: 'WrenConversationSummary',
    id: 'conv-mentor-prep',
    title: 'Mentor call follow-up',
    preview: 'Pricing leverage came through. Next time: the team-structure question.',
    updatedAt: '2026-05-26T18:42:00.000Z',
    messageCount: 8
  },
  {
    __typename: 'WrenConversationSummary',
    id: 'conv-launch-week',
    title: 'Launch-week post-mortem',
    preview: 'What we learned: pricing message was muddled. What worked: the onboarding flow.',
    updatedAt: '2026-05-25T11:10:00.000Z',
    messageCount: 14
  },
  {
    __typename: 'WrenConversationSummary',
    id: 'conv-burnout',
    title: 'On feeling stretched',
    preview: 'You named the right thing. Now we make the smaller ask possible.',
    updatedAt: '2026-05-23T22:08:00.000Z',
    messageCount: 6
  }
]

// Per-conversation message histories. The active conversation's messages
// come from `wrenMessages` above (the WrenMessages query). The others are
// only used client-side when the user switches conversations — kept here so
// the mock experience stays cohesive.
const wrenConversationMessages = {
  'conv-today': wrenMessages,
  'conv-mentor-prep': [
    // 2026-05-25 — pre-call prep (mp1–mp3)
    {
      __typename: 'WrenMessage',
      id: 'mp1',
      sender: 'coach',
      text: 'Quick prep check before tomorrow. What is the one question you most want answered on the call?',
      actions: [],
      status: 'complete',
      createdAt: '2026-05-25T20:00:00.000Z'
    },
    {
      __typename: 'WrenMessage',
      id: 'mp2',
      sender: 'user',
      text: 'How much pricing leverage we actually have right now. Everything else can wait.',
      actions: [],
      status: 'complete',
      createdAt: '2026-05-25T20:02:00.000Z'
    },
    {
      __typename: 'WrenMessage',
      id: 'mp3',
      sender: 'coach',
      text: 'Good focus. I will pin that as the single must-answer and let the rest emerge naturally.',
      actions: [],
      status: 'complete',
      createdAt: '2026-05-25T20:03:00.000Z'
    },
    // 2026-05-26 — post-call debrief (mp4–mp8)
    {
      __typename: 'WrenMessage',
      id: 'mp4',
      sender: 'coach',
      text: 'How did the mentor call land?',
      actions: [],
      status: 'complete',
      createdAt: '2026-05-26T18:00:00.000Z'
    },
    {
      __typename: 'WrenMessage',
      id: 'mp5',
      sender: 'user',
      text: 'Better than expected. The launch update was crisp, and they gave me a real answer on pricing.',
      actions: [],
      status: 'complete',
      createdAt: '2026-05-26T18:02:00.000Z'
    },
    {
      __typename: 'WrenMessage',
      id: 'mp6',
      sender: 'coach',
      text: 'What did they suggest on pricing? Worth pinning so we do not relitigate it later.',
      actions: [],
      status: 'complete',
      createdAt: '2026-05-26T18:03:00.000Z'
    },
    {
      __typename: 'WrenMessage',
      id: 'mp7',
      sender: 'user',
      text: 'Raise the base tier 20%, keep the team tier where it is, and add a usage-based add-on for power users.',
      actions: [],
      status: 'complete',
      createdAt: '2026-05-26T18:05:00.000Z'
    },
    {
      __typename: 'WrenMessage',
      id: 'mp8',
      sender: 'user',
      text: 'Pricing leverage came through. Next time: the team-structure question.',
      actions: [],
      status: 'complete',
      createdAt: '2026-05-26T18:42:00.000Z'
    }
  ],
  'conv-launch-week': [
    // 2026-05-24 — initial post-mortem kickoff (lw1–lw8)
    {
      __typename: 'WrenMessage',
      id: 'lw1',
      sender: 'coach',
      text: 'Launch week is closing out. Want to do a quick post-mortem while the details are warm?',
      actions: [],
      status: 'complete',
      createdAt: '2026-05-24T17:30:00.000Z'
    },
    {
      __typename: 'WrenMessage',
      id: 'lw2',
      sender: 'user',
      text: 'Yes. I want to capture this before I move on.',
      actions: [],
      status: 'complete',
      createdAt: '2026-05-24T17:32:00.000Z'
    },
    {
      __typename: 'WrenMessage',
      id: 'lw3',
      sender: 'coach',
      text: 'Three questions. What worked, what did not, and what surprised you. Take them in any order.',
      actions: [],
      status: 'complete',
      createdAt: '2026-05-24T17:33:00.000Z'
    },
    {
      __typename: 'WrenMessage',
      id: 'lw4',
      sender: 'user',
      text: 'Worked: the onboarding flow felt clean. Did not: the pricing message was muddled. Surprised: the audience cared more about the integrations than the headline feature.',
      actions: [],
      status: 'complete',
      createdAt: '2026-05-24T17:38:00.000Z'
    },
    {
      __typename: 'WrenMessage',
      id: 'lw5',
      sender: 'coach',
      text: 'That last one is the most important. Reframe: integrations are a primary value, not a footnote. How does that change the landing page?',
      actions: [],
      status: 'complete',
      createdAt: '2026-05-24T17:40:00.000Z'
    },
    {
      __typename: 'WrenMessage',
      id: 'lw6',
      sender: 'user',
      text: 'Probably needs a second hero section. Maybe the integrations move above the fold.',
      actions: [],
      status: 'complete',
      createdAt: '2026-05-24T17:43:00.000Z'
    },
    {
      __typename: 'WrenMessage',
      id: 'lw7',
      sender: 'coach',
      text: 'Worth testing. I will spin up a hypothesis card. What is one signal that would confirm or kill the change in two weeks?',
      actions: [{ __typename: 'WrenSuggestedAction', label: 'Create hypothesis card' }],
      status: 'complete',
      createdAt: '2026-05-24T17:44:00.000Z'
    },
    {
      __typename: 'WrenMessage',
      id: 'lw8',
      sender: 'user',
      text: 'Signup conversion on integrations CTA. If it doubles, the move is right.',
      actions: [],
      status: 'complete',
      createdAt: '2026-05-24T17:47:00.000Z'
    },
    // 2026-05-25 — morning follow-up on pricing copy + review open (lw9–lw14)
    {
      __typename: 'WrenMessage',
      id: 'lw9',
      sender: 'coach',
      text: 'Recorded. Now the muddled pricing — was it the copy, the structure, or the audience?',
      actions: [],
      status: 'complete',
      createdAt: '2026-05-25T09:19:00.000Z'
    },
    {
      __typename: 'WrenMessage',
      id: 'lw10',
      sender: 'user',
      text: 'Copy. The structure is right, we just used the wrong words for what each tier unlocks.',
      actions: [],
      status: 'complete',
      createdAt: '2026-05-25T09:22:00.000Z'
    },
    {
      __typename: 'WrenMessage',
      id: 'lw11',
      sender: 'coach',
      text: 'Easier to fix. Want me to open a Wren-led copy review with the existing tier descriptions?',
      actions: [
        { __typename: 'WrenSuggestedAction', label: 'Open review' },
        { __typename: 'WrenSuggestedAction', label: 'Later' }
      ],
      status: 'complete',
      createdAt: '2026-05-25T09:23:00.000Z'
    },
    {
      __typename: 'WrenMessage',
      id: 'lw12',
      sender: 'user',
      text: 'Open it.',
      actions: [],
      status: 'complete',
      createdAt: '2026-05-25T09:24:00.000Z'
    },
    {
      __typename: 'WrenMessage',
      id: 'lw13',
      sender: 'coach',
      text: 'Opened. I will have a first pass by tomorrow morning so you can edit, not generate.',
      actions: [],
      status: 'complete',
      createdAt: '2026-05-25T09:24:30.000Z'
    },
    {
      __typename: 'WrenMessage',
      id: 'lw14',
      sender: 'user',
      text: 'What we learned: pricing message was muddled. What worked: the onboarding flow.',
      actions: [],
      status: 'complete',
      createdAt: '2026-05-25T11:10:00.000Z'
    }
  ],
  'conv-burnout': [
    {
      __typename: 'WrenMessage',
      id: 'bu1',
      sender: 'user',
      text: 'I am stretched. I do not want to admit it but every day feels like a day I am behind on.',
      actions: [],
      status: 'complete',
      createdAt: '2026-05-23T21:50:00.000Z'
    },
    {
      __typename: 'WrenMessage',
      id: 'bu2',
      sender: 'coach',
      text: 'Naming it is the first move. What is the smallest thing you could cut from this week and feel relief, not guilt?',
      actions: [],
      status: 'complete',
      createdAt: '2026-05-23T21:52:00.000Z'
    },
    {
      __typename: 'WrenMessage',
      id: 'bu3',
      sender: 'user',
      text: 'The Friday community call. It is a "should" not a "want".',
      actions: [],
      status: 'complete',
      createdAt: '2026-05-23T21:55:00.000Z'
    },
    {
      __typename: 'WrenMessage',
      id: 'bu4',
      sender: 'coach',
      text: 'Drop it for one week. Tell yourself it is an experiment, not a commitment. If you miss it, you can reinstate. Want me to draft the cancellation note?',
      actions: [
        { __typename: 'WrenSuggestedAction', label: 'Draft the note' },
        { __typename: 'WrenSuggestedAction', label: 'I will handle it' }
      ],
      status: 'complete',
      createdAt: '2026-05-23T21:58:00.000Z'
    },
    {
      __typename: 'WrenMessage',
      id: 'bu5',
      sender: 'user',
      text: 'Draft it. Keep it short, no apologies.',
      actions: [],
      status: 'complete',
      createdAt: '2026-05-23T21:59:00.000Z'
    },
    {
      __typename: 'WrenMessage',
      id: 'bu6',
      sender: 'coach',
      text: 'You named the right thing. Now we make the smaller ask possible.',
      actions: [],
      status: 'complete',
      createdAt: '2026-05-23T22:08:00.000Z'
    }
  ]
}

const wrenConversation = {
  __typename: 'WrenConversationView',
  id: 'mock-conv-1',
  userId: 'mock-user-1',
  startedAt: '2026-05-27T06:00:00.000Z',
  closedAt: null
}

const wrenSettings = {
  __typename: 'WrenSettings',
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
              __typename: 'WrenMessage',
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
  wrenConversations: () => ({ wrenConversations }),
  wrenConversationMessages: variables => {
    const list = wrenConversationMessages[variables?.conversationId] ?? []
    return { wrenConversationMessages: list }
  },
  wrenSettings: () => ({ wrenSettings }),
  wrenMemoryNotes: () => ({ wrenMemoryNotes }),
  sendWrenMessage: variables => ({
    sendWrenMessage: {
      __typename: 'WrenMessage',
      id: `wm-new-${Date.now()}`,
      sender: 'coach',
      text: `Got it. You said: "${variables.text}". I am processing that now.`,
      // status mirrors the schema's WrenMessage.status non-null contract;
      // 'complete' matches the legacy scripted path (no streaming).
      status: 'complete',
      actions: [],
      createdAt: new Date().toISOString()
    }
  }),
  updateWrenSettings: variables => ({
    updateWrenSettings: {
      __typename: 'WrenSettings',
      displayName: variables.displayName ?? null,
      tone: variables.tone ?? 'warm',
      enabled: variables.enabled ?? true,
      dailyTurnCap: variables.dailyTurnCap ?? null
    }
  }),
  exportWrenConversation: variables => ({
    exportWrenConversation: {
      __typename: 'WrenExport',
      format: variables.format ?? 'markdown',
      filename: `wren-conversation.${variables.format === 'json' ? 'json' : 'md'}`,
      content:
        variables.format === 'json'
          ? JSON.stringify({ messages: wrenMessages }, null, 2)
          : wrenMessages.map(m => `**${m.sender}** (${m.createdAt}): ${m.text}`).join('\n\n')
    }
  }),
  undoWrenAction: () => ({ undoWrenAction: true }),
  confirmWrenAction: () => ({
    confirmWrenAction: {
      __typename: 'WrenAppliedAction',
      kind: 'apply',
      summary: 'Mock action applied',
      refType: 'task',
      refId: 'mock-ref-1',
      undoToken: `undo-${Date.now()}`,
      undoExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    }
  }),
  cancelWrenAction: () => ({ cancelWrenAction: true }),
  // Subscription fixture: must return an Observable. The mock link forwards
  // its emissions to subscribers (multiple events before complete).
  wrenStream
}
