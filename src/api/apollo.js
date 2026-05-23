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

let accessToken = null

// Single in-flight refresh promise — prevents concurrent UNAUTHENTICATED
// errors from triggering multiple simultaneous refresh calls.
let refreshing = null

export function setAccessToken(token) {
  accessToken = token
}

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
            import('@/router/index.js').then(({ default: router }) => {
              router.push({ name: 'login' })
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
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true') {
    const payload = mockRegistry.refreshToken().refreshToken
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
if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true') {
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
