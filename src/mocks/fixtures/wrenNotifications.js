/**
 * Mock-only pool of proactive Wren notifications.
 *
 * Lives outside the Apollo mock registry on purpose: these are not GraphQL
 * fixtures, they drive the `useWrenMockNotifications` composable that fires a
 * floating toast every 30s when VITE_USE_MOCKS=true. The shape is plain JS so
 * the composable can pull a random entry without any GraphQL ceremony.
 *
 * Each type carries:
 *   - id: stable string used to colour-key the toast
 *   - label: short uppercase eyebrow above the body
 *   - icon: Heroicons outline component name (resolved by the toast)
 *   - accent: token name from the design system (drives the type bar +
 *             glow). Maps to CSS vars: 'accent' | 'ok' | 'warn' | 'bad'
 *   - messages: pool of body strings — one is picked at random per fire
 *   - cta: optional { label, action } shown as a chip-style button
 */

export const WREN_NOTIFICATION_TYPES = [
  {
    id: 'focus',
    label: 'Focus',
    icon: 'sparkles',
    accent: 'accent',
    messages: [
      'You have 3 tasks left in today’s Top 3. The writing one is the heavy rock — want to start there?',
      'Two hours of unbroken time on your calendar before lunch. Worth giving it to the pricing rewrite.',
      'You’ve been bouncing between four tabs. Pick one task and I’ll mute the rest for an hour.'
    ],
    cta: { label: 'Open Today', action: 'today' }
  },
  {
    id: 'streak',
    label: 'Streak',
    icon: 'fire',
    accent: 'warn',
    messages: [
      'Six-day streak. One more morning locks it into a habit, not a run.',
      'You’ve closed your daily plan 11 days in a row. That is the longest stretch this quarter.',
      'Three chores done before noon — streak protected for today.'
    ],
    cta: { label: 'See streak', action: 'chores' }
  },
  {
    id: 'encouragement',
    label: 'Encouragement',
    icon: 'heart',
    accent: 'accent',
    messages: [
      'Tough start? Two sentences is enough. Momentum almost always handles the rest.',
      'The writing task has been on your list four days. You will feel lighter the minute it ships.',
      'You don’t have to do it well right now. You just have to start.'
    ]
  },
  {
    id: 'insight',
    label: 'Insight',
    icon: 'lightbulb',
    accent: 'accent',
    messages: [
      'Noticed: pricing-related tasks take you about 3× longer than you estimate. Want me to pad them by default?',
      'Your best writing happens between 09:00 and 11:00. I’ll keep that window clear from now on.',
      'You finish 80% more tasks on days you start with a walk. Worth keeping the morning walk sacred.'
    ],
    cta: { label: 'Log insight', action: 'wren' }
  },
  {
    id: 'reminder',
    label: 'Reminder',
    icon: 'clock',
    accent: 'warn',
    messages: [
      'Mentor call in 25 minutes. Your one-page brief is ready — want it on screen?',
      'Guardrail check: it’s 10:55 and the writing task has not started. Two-sentence rule still applies.',
      'Coffee with Sam is on the calendar in an hour. You parked two questions for them last week.'
    ],
    cta: { label: 'Open brief', action: 'today' }
  },
  {
    id: 'celebration',
    label: 'Celebration',
    icon: 'sparkle',
    accent: 'ok',
    messages: [
      'Inbox cleared. 47 → 0 in twenty minutes. Clean head for tomorrow.',
      'Three goals nudged forward today. That is what a real working day looks like.',
      'You shipped the draft you said you wouldn’t. Worth pausing to notice.'
    ]
  },
  {
    id: 'nudge',
    label: 'Gentle nudge',
    icon: 'hand-raised',
    accent: 'warn',
    messages: [
      'You opened the writing task, then closed it. Want me to start a 20-minute timer instead?',
      'Three browser tabs are not the assignment. The first sentence is.',
      'You’ve been heads-down for 95 minutes. A five-minute break here keeps the focus honest.'
    ],
    cta: { label: 'Start 20-min timer', action: 'today' }
  },
  {
    id: 'tip',
    label: 'Tip',
    icon: 'bookmark',
    accent: 'accent',
    messages: [
      'Pin one Big Rock at 09:00 tomorrow morning. Protected time is the difference between a plan and a wish.',
      'When a task feels heavier than it should, it usually means a hidden decision. Want help unpacking?',
      'Two-minute rule: if you can answer the email in under two minutes, do it now. Otherwise snooze it.'
    ]
  },
  {
    id: 'win',
    label: 'Micro-win',
    icon: 'check-badge',
    accent: 'ok',
    messages: [
      'You moved the pricing task from “someday” to “today.” That is half the battle.',
      'Three chores done before 10am. Tomorrow-you will be glad.',
      'You said no to a meeting that didn’t need you. That is a real productivity move.'
    ]
  },
  {
    id: 'time',
    label: 'Time check',
    icon: 'clock',
    accent: 'accent',
    messages: [
      'Afternoon block starts in 10 minutes. Cleanest hour of your day — spend it on the hard task.',
      'You’ve been on this task 45 minutes. Want me to log the time and roll you into a break?',
      'End-of-day in two hours. One Big Rock left. Is it still the right one?'
    ],
    cta: { label: 'See day', action: 'today' }
  }
]

/**
 * Pick a random notification type, then a random message from its pool.
 * Avoids repeating the same type back-to-back when a previous id is passed.
 *
 * @param {string|null} previousId - Last fired type id, to avoid immediate repeats
 * @returns {{
 *   id: string, label: string, icon: string, accent: string,
 *   text: string, cta: { label: string, action: string } | null
 * }}
 */
export function pickRandomNotification(previousId = null) {
  const pool =
    previousId && WREN_NOTIFICATION_TYPES.length > 1
      ? WREN_NOTIFICATION_TYPES.filter(t => t.id !== previousId)
      : WREN_NOTIFICATION_TYPES

  const type = pool[Math.floor(Math.random() * pool.length)]
  const text = type.messages[Math.floor(Math.random() * type.messages.length)]

  return {
    id: type.id,
    label: type.label,
    icon: type.icon,
    accent: type.accent,
    text,
    cta: type.cta ?? null
  }
}
