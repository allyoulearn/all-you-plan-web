/**
 * Operations barrel — re-exports every GraphQL query, mutation, and fragment
 * by feature module. Import from here (`@/api/operations/index.js`) rather
 * than the per-feature files so the dependency graph stays simple and stores
 * pick up cross-module symbols (e.g. `COMPLETE_PROJECT_TASK` aliased from
 * `today.js` via `projects.js`). (WEB-W1-12)
 */
export * from './auth.js'
export * from './today.js'
export * from './chores.js'
export * from './projects.js'
export * from './wren.js'
export * from './review.js'
export * from './calendar.js'
export * from './stats.js'
export * from './journal.js'
export * from './inbox.js'
