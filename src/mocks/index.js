/**
 * Mock fixture registry.
 * Merges every domain's fixture registry into one object keyed by GraphQL root
 * field name. Consumed by the mock link in `src/api/apollo.js`.
 */
import { registry as auth } from './fixtures/auth.js'
import { registry as today } from './fixtures/today.js'
import { registry as chores } from './fixtures/chores.js'
import { registry as projects } from './fixtures/projects.js'
import { registry as calendar } from './fixtures/calendar.js'
import { registry as calendarConnections } from './fixtures/calendarConnections.js'
import { registry as stats } from './fixtures/stats.js'
import { registry as journal } from './fixtures/journal.js'
import { registry as inbox } from './fixtures/inbox.js'
import { registry as review } from './fixtures/review.js'
import { registry as wren } from './fixtures/wren.js'
import { registry as briefing } from './fixtures/briefing.js'
import { registry as goals } from './fixtures/goals.js'
import { registry as notifications } from './fixtures/notifications.js'
import { registry as search } from './fixtures/search.js'
import { registry as onboarding } from './fixtures/onboarding.js'
import { registry as sessions } from './fixtures/sessions.js'
import { registry as account } from './fixtures/account.js'
import { registry as billing } from './fixtures/billing.js'

export const mockRegistry = {
  ...auth,
  ...today,
  ...chores,
  ...projects,
  ...calendar,
  ...calendarConnections,
  ...stats,
  ...journal,
  ...inbox,
  ...review,
  ...wren,
  ...briefing,
  ...goals,
  ...notifications,
  ...search,
  ...onboarding,
  ...sessions,
  ...account,
  ...billing
}
