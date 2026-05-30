/** Mock fixtures for Wren's morning briefing. */

const GREETINGS = {
  warm: 'Good morning, Mara. The lease lands Friday — today is mostly yours. Protect 10:30 for chapter 3, and the rest can wait.',
  direct:
    '5/8 today. Chapter 3 outline at 10:30. Lease confirms Friday. "Learn Rust" hasn\'t moved in 9 days — decide.',
  playful:
    'Hi! Five down, three to go, and a chapter outline at 10:30 (the bright spot). Rust is still glaring at you from across the room.',
  gentle:
    "Morning, Mara. Today is steady. There's one real thing — the chapter 3 outline at 10:30. Everything else can drift, if it needs to."
}

/**
 * Build a mocked briefing payload for the given tone. Falls back to 'warm'
 * when the tone has no greeting in the seed map.
 * @param {string} [tone]
 * @returns {object}
 */
function buildBriefing(tone = 'warm') {
  return {
    state: 'normal',
    greeting: GREETINGS[tone] ?? GREETINGS.warm,
    tone,
    generatedAt: new Date().toISOString(),
    expiresAt: null,
    actions: [
      {
        id: 'a1',
        label: 'Block 10:30 for chapter 3',
        kind: 'schedule',
        targetType: 'task',
        targetId: 'mock-task-1'
      },
      {
        id: 'a2',
        label: 'Snooze "Learn Rust" to Saturday',
        kind: 'snooze',
        targetType: 'project',
        targetId: 'mock-project-rust'
      },
      { id: 'a3', label: 'Add to inbox…', kind: 'capture', targetType: null, targetId: null }
    ]
  }
}

export const registry = {
  todayBriefing: () => ({ todayBriefing: buildBriefing('warm') }),
  regenerateTodayBriefing: () => ({ regenerateTodayBriefing: buildBriefing('warm') })
}
