import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client/core'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { onError } from '@apollo/client/link/error'
import { createClient } from 'graphql-ws'

let accessToken = null

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
    },
  },
})

const wsUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/graphql`
const wsLink = new GraphQLWsLink(
  createClient({
    url: wsUrl,
    connectionParams: () => ({
      Authorization: accessToken ? `Bearer ${accessToken}` : '',
    }),
    retryAttempts: 5,
    shouldRetry: () => true,
  }),
)

const splitLink = split(
  ({ query }) => {
    const def = getMainDefinition(query)
    return def.kind === 'OperationDefinition' && def.operation === 'subscription'
  },
  wsLink,
  httpLink,
)

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      if (err.extensions?.code === 'UNAUTHENTICATED') {
        refreshAccessToken().catch(() => {
          setAccessToken(null)
          window.location.href = '/auth/login'
        })
      }
    }
  }
  if (networkError) {
    console.error('[Network error]:', networkError)
  }
})

async function refreshAccessToken() {
  const res = await fetch('/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      query: 'mutation { refreshToken { accessToken user { id email name timezone streak { current best lastCompletionDate } settings { theme mode density coachPersonality checkIns stalledNudgeDays journalVisibility } } } }',
    }),
  })
  const json = await res.json()
  if (json.data?.refreshToken) {
    setAccessToken(json.data.refreshToken.accessToken)
    return json.data.refreshToken
  }
  throw new Error('Refresh failed')
}

export { refreshAccessToken }

export const apolloClient = new ApolloClient({
  link: errorLink.concat(splitLink),
  cache: new InMemoryCache({
    typePolicies: {
      Task: { keyFields: ['id'] },
    },
  }),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
    query: { fetchPolicy: 'network-only' },
  },
})
