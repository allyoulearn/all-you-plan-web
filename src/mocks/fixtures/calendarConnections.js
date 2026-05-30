/**
 * Mock fixtures for external calendar connections (Google for now).
 *
 * Lives in its own file (mirroring `src/api/operations/calendarConnections.js`)
 * so the Settings → Billing screen can render the connect / disconnect flow in
 * mock mode without hitting Google. `disconnectGoogleCalendar` mutates the
 * in-memory list so a subsequent `myCalendarConnections` query reflects the
 * change.
 */

let connections = [
  {
    id: 'cc1',
    provider: 'google',
    email: 'lucas@example.com',
    status: 'active',
    lastSyncedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  }
]

export const registry = {
  myCalendarConnections: () => ({ myCalendarConnections: [...connections] }),
  connectGoogleCalendar: () => ({
    connectGoogleCalendar: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?mock=true'
    }
  }),
  disconnectGoogleCalendar: (variables = {}) => {
    const before = connections.length
    connections = connections.filter(c => c.id !== variables.id)
    return { disconnectGoogleCalendar: connections.length < before }
  }
}
