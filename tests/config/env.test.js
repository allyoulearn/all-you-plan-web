/**
 * Tests for src/config/env.js — the fail-fast env validation (G-12).
 *
 * env.js resolves its exported constants at import time, so each case stubs
 * the env, resets the module registry, then dynamically imports a fresh copy.
 * This mirrors the vi.stubEnv pattern used in tests/api/apollo.test.js.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('config/env.js', () => {
  describe('production fail-fast', () => {
    it('throws when VITE_GRAPHQL_URL is missing in production', async () => {
      vi.stubEnv('PROD', true)
      vi.stubEnv('VITE_GRAPHQL_URL', '')
      vi.stubEnv('VITE_WS_URL', 'wss://api.example.com/graphql')
      vi.stubEnv('VITE_WREN_URL', 'https://wren.example.com')

      await expect(import('@/config/env.js')).rejects.toThrow(
        /Missing required env VITE_GRAPHQL_URL/
      )
    })

    it('throws when VITE_WS_URL is missing in production', async () => {
      vi.stubEnv('PROD', true)
      vi.stubEnv('VITE_GRAPHQL_URL', 'https://api.example.com/graphql')
      vi.stubEnv('VITE_WS_URL', '')
      vi.stubEnv('VITE_WREN_URL', 'https://wren.example.com')

      await expect(import('@/config/env.js')).rejects.toThrow(/Missing required env VITE_WS_URL/)
    })

    it('throws when VITE_WREN_URL is missing in production', async () => {
      vi.stubEnv('PROD', true)
      vi.stubEnv('VITE_GRAPHQL_URL', 'https://api.example.com/graphql')
      vi.stubEnv('VITE_WS_URL', 'wss://api.example.com/graphql')
      vi.stubEnv('VITE_WREN_URL', '')

      await expect(import('@/config/env.js')).rejects.toThrow(/Missing required env VITE_WREN_URL/)
    })

    it('treats a whitespace-only value as missing in production', async () => {
      vi.stubEnv('PROD', true)
      vi.stubEnv('VITE_GRAPHQL_URL', '   ')
      vi.stubEnv('VITE_WS_URL', 'wss://api.example.com/graphql')
      vi.stubEnv('VITE_WREN_URL', 'https://wren.example.com')

      await expect(import('@/config/env.js')).rejects.toThrow(
        /Missing required env VITE_GRAPHQL_URL/
      )
    })

    it('resolves all values when every required URL is set in production', async () => {
      vi.stubEnv('PROD', true)
      vi.stubEnv('VITE_GRAPHQL_URL', 'https://api.example.com/graphql')
      vi.stubEnv('VITE_WS_URL', 'wss://api.example.com/graphql')
      vi.stubEnv('VITE_WREN_URL', 'https://wren.example.com')

      const env = await import('@/config/env.js')

      expect(env.GRAPHQL_URL).toBe('https://api.example.com/graphql')
      expect(env.WS_URL).toBe('wss://api.example.com/graphql')
      expect(env.WREN_URL).toBe('https://wren.example.com')
    })

    it('trims surrounding whitespace from resolved values', async () => {
      vi.stubEnv('PROD', true)
      vi.stubEnv('VITE_GRAPHQL_URL', '  https://api.example.com/graphql  ')
      vi.stubEnv('VITE_WS_URL', 'wss://api.example.com/graphql')
      vi.stubEnv('VITE_WREN_URL', 'https://wren.example.com')

      const env = await import('@/config/env.js')

      expect(env.GRAPHQL_URL).toBe('https://api.example.com/graphql')
    })
  })

  describe('dev / non-production fallbacks', () => {
    it('falls back to safe dev defaults when URLs are unset (not prod)', async () => {
      vi.stubEnv('PROD', false)
      vi.stubEnv('VITE_GRAPHQL_URL', '')
      vi.stubEnv('VITE_WS_URL', '')
      vi.stubEnv('VITE_WREN_URL', '')

      const env = await import('@/config/env.js')

      expect(env.GRAPHQL_URL).toBe('/graphql')
      // jsdom provides window.location.host, so WS falls back to wss://<host>.
      expect(env.WS_URL).toMatch(/^wss:\/\/.+\/graphql$/)
      expect(env.WREN_URL).toBe('http://localhost:5180')
    })

    it('prefers explicit env values over dev defaults', async () => {
      vi.stubEnv('PROD', false)
      vi.stubEnv('VITE_WS_URL', 'ws://localhost:4100/graphql')

      const env = await import('@/config/env.js')

      expect(env.WS_URL).toBe('ws://localhost:4100/graphql')
    })

    it('does not throw in dev even with everything unset', async () => {
      vi.stubEnv('PROD', false)
      vi.stubEnv('VITE_GRAPHQL_URL', '')
      vi.stubEnv('VITE_WS_URL', '')
      vi.stubEnv('VITE_WREN_URL', '')

      await expect(import('@/config/env.js')).resolves.toBeDefined()
    })
  })

  describe('SENTRY_DSN', () => {
    it('is an empty string when VITE_SENTRY_DSN is unset', async () => {
      vi.stubEnv('PROD', false)
      vi.stubEnv('VITE_SENTRY_DSN', '')

      const env = await import('@/config/env.js')
      expect(env.SENTRY_DSN).toBe('')
    })

    it('passes through a configured DSN (trimmed)', async () => {
      vi.stubEnv('PROD', false)
      vi.stubEnv('VITE_SENTRY_DSN', '  https://abc@o1.ingest.sentry.io/1  ')

      const env = await import('@/config/env.js')
      expect(env.SENTRY_DSN).toBe('https://abc@o1.ingest.sentry.io/1')
    })
  })

  describe('resolveGraphqlUrl (call-time)', () => {
    it('returns the current VITE_GRAPHQL_URL at call time', async () => {
      vi.stubEnv('PROD', false)
      vi.stubEnv('VITE_GRAPHQL_URL', 'https://api.example.com/graphql')

      const env = await import('@/config/env.js')
      expect(env.resolveGraphqlUrl()).toBe('https://api.example.com/graphql')
    })

    it('falls back to /graphql when unset', async () => {
      vi.stubEnv('PROD', false)
      vi.stubEnv('VITE_GRAPHQL_URL', '')

      const env = await import('@/config/env.js')
      expect(env.resolveGraphqlUrl()).toBe('/graphql')
    })
  })
})
