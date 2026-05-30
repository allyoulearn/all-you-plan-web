/**
 * Mock Apollo link.
 * Resolves GraphQL operations from a fixture registry instead of the network,
 * keyed by each operation's root field name (so anonymous operations work too).
 * Used only in mock mode; see `src/api/apollo.js`.
 *
 * Queries and mutations: the fixture function returns a plain `data` payload
 * that is emitted once before completing.
 *
 * Subscriptions: the fixture function returns an Apollo `Observable` that the
 * link forwards to the caller. This lets fixtures stream multiple events
 * (e.g., token deltas followed by a complete event) — see
 * `src/mocks/fixtures/wren.js` for an example. If a subscription has no
 * fixture, the link emits an error response rather than hanging silently.
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
 * @param {Record<string, (variables: object) => object|import('@apollo/client/core').Observable<unknown>>} registry
 *   Maps a root field name to a fixture function. For queries and mutations the
 *   function returns the operation's `data` payload. For subscriptions it
 *   returns an `Observable` that emits FetchResult shapes.
 * @returns {ApolloLink}
 */
export function createMockLink(registry) {
  return new ApolloLink(operation => {
    return new Observable(observer => {
      const def = getMainDefinition(operation.query)
      const field = getRootFieldName(operation.query)
      const fixture = field ? registry[field] : null

      // Subscriptions: forward the fixture's Observable so it can emit
      // multiple events before completing.
      if (def.kind === 'OperationDefinition' && def.operation === 'subscription') {
        if (!fixture) {
          const msg = `[mock] No subscription fixture for root field "${field ?? '(unknown)'}"`
          console.warn(msg)
          observer.next({ errors: [{ message: msg }] })
          observer.complete()
          return
        }

        const obs = fixture(operation.variables ?? {})

        if (!obs || typeof obs.subscribe !== 'function') {
          const msg = `[mock] Subscription fixture for "${field}" must return an Observable`
          console.warn(msg)
          observer.next({ errors: [{ message: msg }] })
          observer.complete()
          return
        }

        const sub = obs.subscribe({
          next: value => observer.next(value),
          error: err => observer.error(err),
          complete: () => observer.complete()
        })

        return () => sub.unsubscribe()
      }

      if (fixture) {
        observer.next({ data: fixture(operation.variables ?? {}) })
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
