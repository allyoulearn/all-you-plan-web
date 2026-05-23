/**
 * Mock Apollo link.
 * Resolves GraphQL operations from a fixture registry instead of the network,
 * keyed by each operation's root field name (so anonymous operations work too).
 * Used only in mock mode; see `src/api/apollo.js`.
 *
 * Limitations (WEB-W2-24): only queries and mutations are supported. The link
 * emits a single response then completes — a real subscription would push
 * indefinitely. If a subscription reaches this link the request fails loudly
 * with a clear error rather than silently hanging.
 */
import { ApolloLink, Observable } from '@apollo/client/core'
import { getMainDefinition } from '@apollo/client/utilities'

/**
 * Extract the root field name of a GraphQL operation document.
 * @param {import('graphql').DocumentNode} query
 * @returns {string|null}
 */
function getRootFieldName(query) {
  const def = getMainDefinition(query)
  const selection = def.selectionSet.selections[0]
  if (!selection || selection.kind !== 'Field') return null
  return selection.name.value
}

/**
 * Build an ApolloLink that serves fixtures from `registry` and never forwards
 * to the network.
 * @param {Record<string, (variables: object) => object>} registry - Maps a root
 *   field name to a fixture function returning the operation's `data` payload.
 * @returns {ApolloLink}
 */
export function createMockLink(registry) {
  return new ApolloLink(operation => {
    return new Observable(observer => {
      const def = getMainDefinition(operation.query)
      // WEB-W2-24: subscriptions cannot be served by a fire-once fixture.
      // Emit a loud error so the failure is obvious rather than silently
      // never delivering data.
      if (def.kind === 'OperationDefinition' && def.operation === 'subscription') {
        const field = getRootFieldName(operation.query) ?? '(unknown)'
        const msg = `[mock] Subscriptions are not supported by the mock link (root field "${field}")`
        console.warn(msg)
        observer.next({ errors: [{ message: msg }] })
        observer.complete()
        return
      }
      const field = getRootFieldName(operation.query)
      const fixture = field ? registry[field] : null
      if (fixture) {
        observer.next({ data: fixture(operation.variables) })
      } else {
        console.warn(`[mock] No fixture for root field "${field}" — returning error response.`)
        observer.next({
          errors: [{ message: `[mock] No fixture for root field "${field}"` }]
        })
      }
      observer.complete()
    })
  })
}
