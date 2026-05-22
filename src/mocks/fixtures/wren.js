/** Mock fixtures for the Wren coach screen. */

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

export const registry = {
  wrenMessages: () => ({ wrenMessages }),
  sendWrenMessage: variables => ({
    sendWrenMessage: {
      id: 'wm-new',
      sender: 'wren',
      text: `Got it. You said: "${variables.text}". I am processing that now.`,
      actions: null,
      createdAt: new Date().toISOString()
    }
  })
}
