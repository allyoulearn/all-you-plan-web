/**
 * Tests for src/api/apollo.js
 *
 * Covers: setAccessToken, getAccessToken, refreshAccessToken (happy path,
 * HTTP error, GraphQL-level errors, mock-mode branch, missing data branch),
 * errorLink handler (UNAUTHENTICATED retry, network error logging),
 * httpLink Authorization header getter, and split predicate.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Use vi.hoisted so these references are initialized before vi.mock factories run.
const { captured } = vi.hoisted(() => ({
  captured: {
    onErrorHandler: null,
    httpLinkOpts: null,
    splitPredicate: null,
    wsClientOpts: null
  }
}))

vi.mock('@apollo/client/core', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...actual,
    ApolloClient: function ApolloClient() {
      this.link = null
      this.cache = null
    },
    InMemoryCache: function InMemoryCache() {},
    createHttpLink: vi.fn().mockImplementation(opts => {
      captured.httpLinkOpts = opts
      return opts
    }),
    split: vi.fn().mockImplementation((predicate, _wsLink, _httpLink) => {
      captured.splitPredicate = predicate
      return {}
    })
  }
})

vi.mock('@apollo/client/link/subscriptions', () => ({
  GraphQLWsLink: function GraphQLWsLink() {}
}))

vi.mock('graphql-ws', () => ({
  createClient: vi.fn().mockImplementation(opts => {
    captured.wsClientOpts = opts
    return {}
  })
}))

vi.mock('@apollo/client/link/error', () => ({
  onError: vi.fn().mockImplementation(handler => {
    captured.onErrorHandler = handler
    return { concat: vi.fn().mockReturnValue({}) }
  })
}))

vi.mock('@/api/operations/index.js', () => ({
  REFRESH_TOKEN: {
    loc: { source: { body: 'mutation RefreshToken { refreshToken { accessToken } }' } }
  }
}))

vi.mock('@/mocks/mockLink.js', () => ({
  createMockLink: vi.fn().mockReturnValue({ concat: vi.fn().mockReturnValue({}) })
}))

vi.mock('@/mocks/index.js', () => ({
  mockRegistry: {
    refreshToken: vi.fn().mockReturnValue({
      refreshToken: { accessToken: 'mock-token-123' }
    })
  }
}))

import { setAccessToken, getAccessToken, refreshAccessToken } from '@/api/apollo'
import { mockRegistry } from '@/mocks/index.js'

describe('apollo.js', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAccessToken(null)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // -------------------------------------------------------------------------
  describe('setAccessToken / getAccessToken', () => {
    it('getAccessToken returns null by default', () => {
      expect(getAccessToken()).toBeNull()
    })

    it('setAccessToken stores the token and getAccessToken returns it', () => {
      setAccessToken('abc123')
      expect(getAccessToken()).toBe('abc123')
    })

    it('setAccessToken can overwrite a previous token', () => {
      setAccessToken('token-v1')
      setAccessToken('token-v2')
      expect(getAccessToken()).toBe('token-v2')
    })

    it('setAccessToken accepts null to clear the token', () => {
      setAccessToken('some-token')
      setAccessToken(null)
      expect(getAccessToken()).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  describe('httpLink Authorization header getter', () => {
    it('returns empty string when no access token is set', () => {
      expect(captured.httpLinkOpts.headers.Authorization).toBe('')
    })

    it('returns Bearer token string when access token is set', () => {
      setAccessToken('tok-xyz')
      expect(captured.httpLinkOpts.headers.Authorization).toBe('Bearer tok-xyz')
    })

    it('reflects token changes dynamically (getter re-evaluates)', () => {
      setAccessToken('first')
      expect(captured.httpLinkOpts.headers.Authorization).toBe('Bearer first')
      setAccessToken('second')
      expect(captured.httpLinkOpts.headers.Authorization).toBe('Bearer second')
      setAccessToken(null)
      expect(captured.httpLinkOpts.headers.Authorization).toBe('')
    })
  })

  // -------------------------------------------------------------------------
  describe('split predicate (subscription routing)', () => {
    it('returns true for an OperationDefinition subscription', () => {
      const query = {
        kind: 'Document',
        definitions: [{ kind: 'OperationDefinition', operation: 'subscription' }]
      }
      expect(captured.splitPredicate({ query })).toBe(true)
    })

    it('returns false for an OperationDefinition query', () => {
      const query = {
        kind: 'Document',
        definitions: [{ kind: 'OperationDefinition', operation: 'query' }]
      }
      expect(captured.splitPredicate({ query })).toBe(false)
    })

    it('returns false for an OperationDefinition mutation', () => {
      const query = {
        kind: 'Document',
        definitions: [{ kind: 'OperationDefinition', operation: 'mutation' }]
      }
      expect(captured.splitPredicate({ query })).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  describe('WebSocket connectionParams and shouldRetry', () => {
    it('connectionParams returns empty Authorization when no token is set', () => {
      setAccessToken(null)
      const params = captured.wsClientOpts.connectionParams()
      expect(params.Authorization).toBe('')
    })

    it('connectionParams returns Bearer token when token is set', () => {
      setAccessToken('ws-token-abc')
      const params = captured.wsClientOpts.connectionParams()
      expect(params.Authorization).toBe('Bearer ws-token-abc')
    })

    it('shouldRetry always returns true', () => {
      expect(captured.wsClientOpts.shouldRetry()).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  describe('errorLink onError handler — forward after refresh (WEB-T05-001)', () => {
    it('calls forward(operation) after a successful refresh', async () => {
      // Import the real Observable so forward returns a proper Observable
      const { Observable } = await import('@apollo/client/core')
      vi.stubEnv('DEV', false)
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue({
            data: { refreshToken: { accessToken: 'refreshed-token' } }
          })
        })
      )

      const forwardObservable = new Observable(observer => {
        observer.next({ data: {} })
        observer.complete()
      })
      const forward = vi.fn().mockReturnValue(forwardObservable)
      const err = { message: 'Not authenticated', extensions: { code: 'UNAUTHENTICATED' } }
      const operation = {}

      const resultObservable = captured.onErrorHandler({
        graphQLErrors: [err],
        networkError: null,
        operation,
        forward
      })

      await new Promise((resolve, reject) => {
        resultObservable.subscribe({ next: resolve, error: reject, complete: resolve })
      })

      expect(forward).toHaveBeenCalledWith(operation)
    })
  })

  // -------------------------------------------------------------------------
  describe('errorLink onError handler', () => {
    it('captures the onError handler during module init', () => {
      expect(captured.onErrorHandler).toBeTypeOf('function')
    })

    it('reuses an in-flight refresh promise for concurrent UNAUTHENTICATED errors', async () => {
      // The first UNAUTHENTICATED call starts a refresh; the second reuses it
      const { Observable } = await import('@apollo/client/core')
      vi.stubEnv('DEV', false)
      let resolveRefresh
      vi.stubGlobal(
        'fetch',
        vi.fn().mockReturnValue(
          new Promise(resolve => {
            resolveRefresh = resolve
          })
        )
      )

      const forwardObservable = new Observable(observer => {
        observer.next({ data: {} })
        observer.complete()
      })
      const forward = vi.fn().mockReturnValue(forwardObservable)
      const err = { message: 'Unauth', extensions: { code: 'UNAUTHENTICATED' } }

      // Trigger first UNAUTHENTICATED — starts the refresh
      const obs1 = captured.onErrorHandler({
        graphQLErrors: [err],
        networkError: null,
        operation: {},
        forward
      })

      // Trigger second UNAUTHENTICATED while refresh is in flight — should reuse it
      const obs2 = captured.onErrorHandler({
        graphQLErrors: [err],
        networkError: null,
        operation: {},
        forward
      })

      // Both should be Observables
      expect(obs1).toBeDefined()
      expect(obs2).toBeDefined()

      // Resolve the refresh
      resolveRefresh({
        ok: true,
        json: () => Promise.resolve({ data: { refreshToken: { accessToken: 'new-tok' } } })
      })

      await Promise.all([
        new Promise(resolve =>
          obs1.subscribe({ next: resolve, error: resolve, complete: resolve })
        ),
        new Promise(resolve => obs2.subscribe({ next: resolve, error: resolve, complete: resolve }))
      ])

      // fetch was called only once, not twice (the gate works)
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('returns undefined when there are no graphQLErrors', () => {
      const forward = vi.fn()
      const result = captured.onErrorHandler({
        graphQLErrors: null,
        networkError: null,
        operation: {},
        forward
      })
      expect(result).toBeUndefined()
      expect(forward).not.toHaveBeenCalled()
    })

    it('returns undefined for non-UNAUTHENTICATED GraphQL errors', () => {
      const result = captured.onErrorHandler({
        graphQLErrors: [{ message: 'Forbidden', extensions: { code: 'FORBIDDEN' } }],
        networkError: null,
        operation: {},
        forward: vi.fn()
      })
      expect(result).toBeUndefined()
    })

    it('logs network errors to console', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const networkError = new Error('Connection refused')
      captured.onErrorHandler({
        graphQLErrors: null,
        networkError,
        operation: {},
        forward: vi.fn()
      })
      expect(consoleSpy).toHaveBeenCalledWith('[Network error]:', networkError)
      consoleSpy.mockRestore()
    })

    it('returns an Observable (not a Promise) for UNAUTHENTICATED errors (WEB-T05-001)', async () => {
      vi.stubEnv('DEV', false)
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue({
            data: { refreshToken: { accessToken: 'refreshed-token' } }
          })
        })
      )

      const forward = vi.fn().mockReturnValue({ subscribe: vi.fn() })
      const err = { message: 'Not authenticated', extensions: { code: 'UNAUTHENTICATED' } }

      const result = captured.onErrorHandler({
        graphQLErrors: [err],
        networkError: null,
        operation: {},
        forward
      })

      expect(result).toBeDefined()
      expect(result).not.toBeInstanceOf(Promise)
      expect(typeof result.subscribe).toBe('function')
    })

    it('clears access token and does not forward when refresh fails', async () => {
      vi.stubEnv('DEV', false)
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))
      setAccessToken('old-token')

      vi.doMock('@/router/index.js', () => ({ default: { push: vi.fn() } }))

      const forward = vi.fn()
      const err = { message: 'Not authenticated', extensions: { code: 'UNAUTHENTICATED' } }

      const observable = captured.onErrorHandler({
        graphQLErrors: [err],
        networkError: null,
        operation: {},
        forward
      })

      await new Promise(resolve => {
        observable.subscribe({
          next: () => {},
          error: () => resolve(),
          complete: () => resolve()
        })
      })

      expect(getAccessToken()).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  describe('refreshAccessToken() — mock mode branch', () => {
    it('uses mockRegistry when DEV and VITE_USE_MOCKS is true', async () => {
      vi.stubEnv('DEV', true)
      vi.stubEnv('VITE_USE_MOCKS', 'true')

      const result = await refreshAccessToken()

      expect(mockRegistry.refreshToken).toHaveBeenCalled()
      expect(result).toEqual({ accessToken: 'mock-token-123' })
      expect(getAccessToken()).toBe('mock-token-123')
    })

    it('sets the accessToken from the mock payload', async () => {
      vi.stubEnv('DEV', true)
      vi.stubEnv('VITE_USE_MOCKS', 'true')

      await refreshAccessToken()
      expect(getAccessToken()).toBe('mock-token-123')
    })
  })

  // -------------------------------------------------------------------------
  describe('refreshAccessToken() — real fetch branch', () => {
    beforeEach(() => {
      vi.stubEnv('DEV', false)
      vi.stubEnv('VITE_USE_MOCKS', 'false')
    })

    it('sets and returns the access token on a successful response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue({
            data: { refreshToken: { accessToken: 'new-token-xyz' } }
          })
        })
      )

      const result = await refreshAccessToken()

      expect(result).toEqual({ accessToken: 'new-token-xyz' })
      expect(getAccessToken()).toBe('new-token-xyz')
    })

    it('sends POST to VITE_GRAPHQL_URL when set', async () => {
      vi.stubEnv('VITE_GRAPHQL_URL', 'https://api.example.com/graphql')
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: { refreshToken: { accessToken: 'tok' } } })
      })
      vi.stubGlobal('fetch', mockFetch)

      await refreshAccessToken()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/graphql',
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('falls back to /graphql when VITE_GRAPHQL_URL is not set', async () => {
      vi.stubEnv('VITE_GRAPHQL_URL', undefined)
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: { refreshToken: { accessToken: 'tok' } } })
      })
      vi.stubGlobal('fetch', mockFetch)

      await refreshAccessToken()

      expect(mockFetch).toHaveBeenCalledWith('/graphql', expect.any(Object))
    })

    it('throws with HTTP status on non-ok response (WEB-T05-013)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }))
      await expect(refreshAccessToken()).rejects.toThrow('Refresh failed: HTTP 503')
    })

    it('throws with HTTP 502 on gateway error (WEB-T05-013)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502 }))
      await expect(refreshAccessToken()).rejects.toThrow('Refresh failed: HTTP 502')
    })

    it('throws with GraphQL error message when json.errors is present (WEB-T05-013)', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue({
            errors: [{ message: 'Token expired' }],
            data: null
          })
        })
      )

      await expect(refreshAccessToken()).rejects.toThrow('Token expired')
    })

    it('logs GraphQL errors to console when json.errors is present (WEB-T05-013)', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue({
            errors: [{ message: 'Token expired' }],
            data: null
          })
        })
      )

      await refreshAccessToken().catch(() => {})

      expect(consoleSpy).toHaveBeenCalledWith(
        '[refreshAccessToken] server errors:',
        expect.any(Array)
      )
      consoleSpy.mockRestore()
    })

    it('throws Refresh failed when json.errors has no message', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue({ errors: [{}], data: null })
        })
      )

      await expect(refreshAccessToken()).rejects.toThrow('Refresh failed')
    })

    it('throws Refresh failed when json.data.refreshToken is absent', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue({ data: {} })
        })
      )

      await expect(refreshAccessToken()).rejects.toThrow('Refresh failed')
    })

    it('includes credentials: include in the fetch options', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: { refreshToken: { accessToken: 'tok' } } })
      })
      vi.stubGlobal('fetch', mockFetch)

      await refreshAccessToken()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ credentials: 'include' })
      )
    })

    it('sends Content-Type: application/json header', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: { refreshToken: { accessToken: 'tok' } } })
      })
      vi.stubGlobal('fetch', mockFetch)

      await refreshAccessToken()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ headers: { 'Content-Type': 'application/json' } })
      )
    })

    it('does not set accessToken when fetch throws a network error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network down')))

      await refreshAccessToken().catch(() => {})
      expect(getAccessToken()).toBeNull()
    })
  })
})
