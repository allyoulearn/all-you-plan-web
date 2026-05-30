/** Mock fixtures for the Inbox screen. */

let inboxItems = [
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
  inboxItems: () => ({ inboxItems: [...inboxItems] }),
  createInboxItem: () => ({ createInboxItem: { id: 'new-inbox-item' } }),
  triageInboxItem: variables => ({
    triageInboxItem: { id: variables.id, triaged: true }
  }),
  deleteInboxItem: (variables = {}) => {
    const before = inboxItems.length
    inboxItems = inboxItems.filter(i => i.id !== variables.id)
    return { deleteInboxItem: inboxItems.length < before }
  },
  triageInboxItemsBulk: (variables = {}) => {
    const ids = Array.isArray(variables.ids) ? variables.ids : []
    return {
      triageInboxItemsBulk: ids.map(id => ({ id, triaged: true }))
    }
  },
  deleteInboxItemsBulk: (variables = {}) => {
    const ids = Array.isArray(variables.ids) ? variables.ids : []
    const before = inboxItems.length
    inboxItems = inboxItems.filter(i => !ids.includes(i.id))
    return { deleteInboxItemsBulk: before - inboxItems.length }
  },
  convertInboxItemsToTasks: (variables = {}) => {
    const ids = Array.isArray(variables.ids) ? variables.ids : []
    // Convert removes the items from the inbox.
    inboxItems = inboxItems.filter(i => !ids.includes(i.id))
    return {
      convertInboxItemsToTasks: ids.map((_, idx) => ({
        id: `task-from-inbox-${Date.now()}-${idx}`
      }))
    }
  }
}
