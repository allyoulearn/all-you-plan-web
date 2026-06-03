/**
 * Operations barrel — re-exports every GraphQL query, mutation, and fragment
 * by feature module. Import from here (`@/api/operations/index.js`) rather
 * than the per-feature files so the dependency graph stays simple and stores
 * pick up cross-module symbols (e.g. `COMPLETE_PROJECT_TASK` aliased from
 * `today.js` via `projects.js`).
 */
export * from './auth.js'

export * from './today.js'

export * from './chores.js'

export * from './projects.js'

export * from './tasks.js'

export * from './wren.js'

export * from './review.js'

export * from './calendar.js'

export * from './stats.js'

export * from './journal.js'

export * from './inbox.js'

export * from './briefing.js'

export * from './goals.js'

export * from './household.js'

export * from './notifications.js'

export * from './search.js'

export * from './onboarding.js'

export * from './sessions.js'

export * from './account.js'

export * from './billing.js'

export * from './gdpr.js'

export * from './imports.js'
