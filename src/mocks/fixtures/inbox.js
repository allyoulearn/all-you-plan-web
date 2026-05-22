/** Mock fixtures for the Inbox screen. */

const inboxItems = [
  {
    id: 'i1',
    text: 'Look into standing desk options',
    source: 'capture',
    triaged: false,
    capturedAt: '2026-05-22T08:15:00.000Z'
  },
  {
    id: 'i2',
    text: 'Follow up with Alex about the API contract',
    source: 'capture',
    triaged: false,
    capturedAt: '2026-05-22T07:48:00.000Z'
  },
  {
    id: 'i3',
    text: 'Book the team offsite venue before end of month',
    source: 'siri',
    triaged: false,
    capturedAt: '2026-05-21T20:30:00.000Z'
  },
  {
    id: 'i4',
    text: 'Research magnesium glycinate dosing',
    source: 'capture',
    triaged: true,
    capturedAt: '2026-05-21T14:00:00.000Z'
  },
  {
    id: 'i5',
    text: 'Schedule car service appointment',
    source: 'capture',
    triaged: false,
    capturedAt: '2026-05-20T09:00:00.000Z'
  }
]

export const registry = {
  inboxItems: () => ({ inboxItems }),
  createInboxItem: () => ({ createInboxItem: { id: 'new-inbox-item' } }),
  triageInboxItem: variables => ({
    triageInboxItem: { id: variables.id, triaged: true }
  })
}
