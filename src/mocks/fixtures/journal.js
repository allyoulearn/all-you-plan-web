/** Mock fixtures for the Journal screen. */

const journalEntries = [
  {
    id: 'j1',
    date: '2026-05-22',
    prompt: 'What is one thing you want to focus on today?',
    pullQuote: 'Clarity is the antidote to anxiety.',
    body: 'I want to focus on finishing the project review without getting distracted by new ideas. The key is to close the loop on what is already in motion before starting anything else. I have been spreading myself too thin and today is the day I course-correct.',
    tags: ['focus', 'priorities']
  },
  {
    id: 'j2',
    date: '2026-05-21',
    prompt: 'What went well today?',
    pullQuote: 'Small wins compound.',
    body: 'The morning walk happened even though I almost skipped it. That set a positive tone for the rest of the day. I shipped the draft and got good feedback. The streak held.',
    tags: ['wins', 'habits']
  },
  {
    id: 'j3',
    date: '2026-05-20',
    prompt: 'What is weighing on you right now?',
    pullQuote: null,
    body: 'Feeling stretched across too many commitments. The new project is exciting but I need to be honest about capacity. Journaling this helps me see that the overwhelm is partly just novelty — it will settle.',
    tags: ['reflection', 'stress']
  },
  {
    id: 'j4',
    date: '2026-05-18',
    prompt: 'What are you grateful for this week?',
    pullQuote: 'Gratitude shifts the lens.',
    body: 'Grateful for the mentor call that happened unexpectedly. Grateful that the fitness routine is holding. Grateful for quiet mornings before the rest of the world wakes up.',
    tags: ['gratitude']
  }
]

export const registry = {
  journalEntries: () => ({ journalEntries }),
  createJournalEntry: () => ({ createJournalEntry: { id: 'new-journal-entry' } })
}
