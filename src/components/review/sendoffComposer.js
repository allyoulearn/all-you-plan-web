/**
 * Compose the daily-review send-off prose from today's data.
 *
 * Pure, deterministic, client-side. Branches on a small grid of
 * (mood × completion-bucket × intent presence) and surfaces streak/win/friction
 * details only when they exist.
 *
 * @param {object} input
 * @param {'heavy'|'low'|'steady'|'good'|'lit'} input.mood
 * @param {number} input.doneCount
 * @param {number} input.totalCount
 * @param {number} input.streak
 * @param {string} input.topWinTitle - optional, first starred completed task title
 * @param {string} input.tomorrowIntent - optional
 * @param {number} input.frictionTagCount - count of friction chips selected
 * @returns {{ headline: string, body: string }}
 */
export function composeSendoff(input) {
  const {
    mood,
    doneCount = 0,
    totalCount = 0,
    streak = 0,
    topWinTitle = '',
    tomorrowIntent = '',
    frictionTagCount = 0
  } = input || {}

  const completion = bucket(doneCount, totalCount)
  const intent = stripTrailingDot(String(tomorrowIntent || '').trim())
  const win = stripTrailingDot(String(topWinTitle || '').trim())
  const moodHeadline = HEADLINES[mood] ?? HEADLINES.steady

  const parts = []
  parts.push(pickOpener(mood, completion))

  if (completion === 'partial' && win) {
    parts.push(`${win} mattered.`)
  }

  if (intent) {
    parts.push(`Tomorrow you said: ${intent}. I'll put it at the top.`)
  }

  if (streak >= 3) {
    parts.push(`${streak} days running. Quietly building.`)
  }

  if (frictionTagCount >= 3 && mood !== 'lit') {
    parts.push("Noted the friction — we'll watch for the pattern.")
  }

  return {
    headline: moodHeadline,
    body: parts.join(' ')
  }
}

function stripTrailingDot(s) {
  return s.replace(/\.+$/, '')
}

function bucket(done, total) {
  if (total <= 0) return 'empty'
  if (done <= 0) return 'none'
  if (done >= total) return 'all'
  return 'partial'
}

const HEADLINES = {
  heavy: 'Heavy day. You still showed up.',
  low: 'Quiet day.',
  steady: 'Solid showing.',
  good: 'Strong day.',
  lit: 'Lit up.'
}

const OPENERS = {
  heavy: {
    none: 'Some days the day wins. Tomorrow is a clean page.',
    partial: 'Heavy day, but you still moved a piece of it.',
    all: 'Heavy day and you cleared the list. That counts double.',
    empty: 'Heavy day. Rest counts.'
  },
  low: {
    none: 'Low energy and the list waited. That happens.',
    partial: 'Low energy but a few things moved.',
    all: 'Low energy and you cleared it anyway. Quiet win.',
    empty: 'Quiet day. That is allowed.'
  },
  steady: {
    none: "Steady day, even if the list didn't move.",
    partial: 'Steady progress.',
    all: 'Steady day, full list cleared.',
    empty: 'Steady. Nothing to clear.'
  },
  good: {
    none: 'Good day on the inside even if the list waited.',
    partial: 'Good day. Real progress.',
    all: 'Good day. Everything on the list.',
    empty: 'Good day.'
  },
  lit: {
    none: 'Energy was there even if the list waited.',
    partial: 'Lit up — a lot moved.',
    all: 'Everything on the list. All of it.',
    empty: 'Energy without the list. Useful in its own way.'
  }
}

function pickOpener(mood, completion) {
  return (OPENERS[mood] ?? OPENERS.steady)[completion] ?? OPENERS.steady.partial
}
