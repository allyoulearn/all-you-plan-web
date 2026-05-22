/**
 * Mock Apollo link.
 * Resolves GraphQL operations from a fixture registry instead of the network,
 * keyed by each operation's root field name (so anonymous operations work too).
 * Used only in mock mode; see `src/api/apollo.js`.
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
