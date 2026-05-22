import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client/core'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { onError } from '@apollo/client/link/error'
import { createClient } from 'graphql-ws'
import { REFRESH_TOKEN } from '@/api/operations'
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

const wsUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/graphql`
const wsLink = new GraphQLWsLink(
  createClient({
    url: wsUrl,
    connectionParams: () => ({
      Authorization: accessToken ? `Bearer ${accessToken}` : ''
    }),
    retryAttempts: 5,
    shouldRetry: () => true
  })
)

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

        return new Promise((resolve, reject) => {
          refreshing
            .then(() => resolve(forward(operation)))
            .catch(() => {
              setAccessToken(null)
              // Lazy-import router to avoid circular dependency at module init.
              import('@/router/index.js').then(({ default: router }) => {
                router.push({ name: 'login' })
              })
              reject(err)
            })
        })
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
  const json = await res.json()
  if (json.data?.refreshToken) {
    setAccessToken(json.data.refreshToken.accessToken)
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
