/** Mock fixtures for the Daily Review screen. */

const mockResponses = {
  wins: {
    starred: ['t1'],
    freeText: 'Got a 30-minute walk in the morning that I had not planned for.'
  },
  friction: {
    text: 'A few unplanned messages in the afternoon pulled me off deep work earlier than expected.',
    tags: ['surprise', 'context-switch']
  },
  leftovers: {
    tomorrow: ['t2'],
    picked: [],
    dropped: [],
    kept: []
  },
  tomorrowIntent: 'Finish the blog draft.'
}

export const registry = {
  dailyReview: variables => ({
    dailyReview: {
      id: 'dr1',
      date: variables.date ?? '2026-05-22',
      mood: 'good',
      responses: mockResponses
    }
  }),
  saveDailyReview: variables => ({
    saveDailyReview: {
      id: 'dr1',
      date: variables.date ?? '2026-05-22',
      mood: variables.mood ?? 'good',
      responses: variables.responses ?? mockResponses
    }
  })
}
