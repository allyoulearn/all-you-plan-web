/** Mock fixtures for the Daily Review screen. */

const mockResponses = {
  'What did you accomplish today?':
    'Finished the weekly update and got my morning walk in. Made meaningful progress on the project board.',
  'What got in the way?':
    'A few unplanned messages in the afternoon pulled me off deep work earlier than expected.',
  'What will you carry into tomorrow?':
    'The mentor call prep and the blog draft. Those are the two non-negotiables.',
  'Energy level check-in': 'Moderate — the sleep was decent but not great. Afternoon was sluggish.'
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
