/**
 * Apollo client configuration.
 *
 * Architecture (link chain order):
 *   mockLink? -> errorLink -> splitLink( wsLink | httpLink )
 *
 * - mockLink: optional dev-only fixture link, enabled when VITE_USE_MOCKS=true.
 *   Short-circuits operations against in-memory fixtures (see /src/mocks/).
 * - errorLink: intercepts UNAUTHENTICATED errors and coordinates a single
 *   in-flight token refresh — concurrent UNAUTHENTICATED errors all await the
 *   same refresh promise, then retry their operation via forward().
 * - splitLink: routes subscription operations to graphql-ws, everything else
 *   to the HTTP link.
 *
 * Auth-token strategy:
 *   The access token is held in module-scoped `accessToken` (not reactive) so
 *   the synchronous header getter on httpLink can read it on every request.
 *   The auth store mirrors the value into a Pinia ref for UI bindings, and
 *   calls setAccessToken() here whenever it updates. resetWsConnection() is
 *   called after each refresh so existing subscriptions reconnect with the
 *   fresh token (WEB-W1-03).
 *
 * Mock toggle:
 *   useMocks() is a function (not a top-level const) so vitest's vi.stubEnv()
 *   can flip the branch at test time without re-importing the module.
 */
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  split,
  fromPromise
} from '@apollo/client/core'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { onError } from '@apollo/client/link/error'
import { createClient } from 'graphql-ws'
import { REFRESH_TOKEN } from '@/api/operations/index.js'
import { createMockLink } from '@/mocks/mockLink.js'
import { mockRegistry } from '@/mocks/index.js'

// Single source of truth for the mock-mode predicate (WEB-W4-23). The DEV
// guard keeps the mock branch from ever shipping into production builds; the
// VITE_USE_MOCKS env var must additionally be 'true' to opt in.
//
// Evaluated lazily inside both call sites (link composition at module init and
// refreshAccessToken at call time) so vitest's vi.stubEnv() can flip the
// branch in tests without re-importing the module.
function useMocks() {
  return import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true'
}

let accessToken = null

// Single in-flight refresh promise — prevents concurrent UNAUTHENTICATED
// errors from triggering multiple simultaneous refresh calls.
let refreshing = null

/**
 * Update the in-memory access token used by `httpLink` and `wsLink`.
 * Called by the auth store after login / register / token refresh / logout.
 * @param {string|null} token
 */
export function setAccessToken(token) {
  accessToken = token
}

/**
 * Read the in-memory access token. Intended only for tests and dev tooling —
 * application code should ask the auth store, which is the canonical owner of
 * session state (WEB-W1-15).
 * @returns {string|null}
 */
export function getAccessToken() {
  return accessToken
}

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL || '/graphql',
  credentials: 'include',
  headers: {
    get Authorization() {
      return accessToken ? `Bearer ${accessToken}` : ''
    }
  }
})

const wsUrl = import.meta.env.VITE_WS_URL || `wss://${window.location.host}/graphql`
const wsClient = createClient({
  url: wsUrl,
  connectionParams: () => ({
    Authorization: accessToken ? `Bearer ${accessToken}` : ''
  }),
  retryAttempts: 5,
  shouldRetry: () => true
})
const wsLink = new GraphQLWsLink(wsClient)

/**
 * Force the WebSocket subscription transport to reconnect.
 * Disposes the underlying graphql-ws client; graphql-ws's retry logic + the
 * GraphQLWsLink will re-establish the connection lazily on the next
 * subscription, picking up the current access token via `connectionParams`.
 *
 * Called after a successful access-token refresh so existing subscriptions
 * stop sending the stale token (WEB-W1-03).
 */
export function resetWsConnection() {
  try {
    wsClient.dispose()
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn('[apollo] resetWsConnection dispose failed:', e?.message)
    }
  }
}

const splitLink = split(
  ({ query }) => {
    const def = getMainDefinition(query)
    return def.kind === 'OperationDefinition' && def.operation === 'subscription'
  },
  wsLink,
  httpLink
)

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      if (err.extensions?.code === 'UNAUTHENTICATED') {
        // Gate all concurrent UNAUTHENTICATED errors behind a single refresh.
        if (!refreshing) {
          refreshing = refreshAccessToken().finally(() => {
            refreshing = null
          })
        }

        return fromPromise(
          refreshing.catch(() => {
            setAccessToken(null)
            // Lazy-import router to avoid circular dependency at module init.
            // WEB-W1-17: chain .catch so a chunk-load failure does not leave
            // the user stuck on the current screen with no auth and no
            // diagnostic; falls back to a hard navigation to /auth/login.
            import('@/router/index.js')
              .then(({ default: router }) => {
                router.push({ name: 'login' })
              })
              .catch(routerErr => {
                console.error('[apollo] failed to redirect to login:', routerErr)
                try {
                  window.location.assign('/auth/login')
                } catch {
                  // Last-resort fallback failed too — nothing else to do.
                }
              })
            return Promise.reject(err)
          })
        ).flatMap(() => forward(operation))
      }
    }
  }
  if (networkError) {
    console.error('[Network error]:', networkError)
  }
})

export async function refreshAccessToken() {
  if (useMocks()) {
    // WEB-W4-22: surface a clear, mockLink-style error if the fixture is
    // missing instead of letting a generic `Cannot read properties of
    // undefined` slip through.
    const fn = mockRegistry.refreshToken
    if (typeof fn !== 'function') {
      throw new Error('[mock] No fixture registered for root field "refreshToken"')
    }
    const result = fn()
    const payload = result?.refreshToken
    if (!payload) {
      throw new Error('[mock] Fixture for "refreshToken" returned no payload')
    }
    setAccessToken(payload.accessToken)
    resetWsConnection()
    return payload
  }
  const res = await fetch(import.meta.env.VITE_GRAPHQL_URL || '/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      query: REFRESH_TOKEN.loc.source.body
    })
  })
  if (!res.ok) {
    throw new Error(`Refresh failed: HTTP ${res.status}`)
  }
  const json = await res.json()
  if (json.errors?.length) {
    console.error('[refreshAccessToken] server errors:', json.errors)
    throw new Error(json.errors[0].message || 'Refresh failed')
  }
  if (json.data?.refreshToken) {
    setAccessToken(json.data.refreshToken.accessToken)
    resetWsConnection()
    return json.data.refreshToken
  }
  throw new Error('Refresh failed')
}

let link = errorLink.concat(splitLink)
if (useMocks()) {
  link = createMockLink(mockRegistry).concat(link)
}

export const apolloClient = new ApolloClient({
  link,
  cache: new InMemoryCache({
    typePolicies: {
      Task: { keyFields: ['id'] }
    }
  }),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
    query: { fetchPolicy: 'network-only' }
  }
})
