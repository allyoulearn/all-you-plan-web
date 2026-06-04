/**
 * Central environment configuration + fail-fast validation (G-12).
 *
 * Single entry point for the `VITE_` URLs the app needs at runtime. All
 * callers (apollo client, WrenCrossAppUpsell, Sentry init) read the resolved
 * values from here instead of touching `import.meta.env` inline, so the
 * fallback / validation logic lives in exactly one place.
 *
 * Fail-fast contract:
 *   - In a production build (`import.meta.env.PROD === true`) every REQUIRED
 *     url (VITE_GRAPHQL_URL / VITE_WS_URL / VITE_WREN_URL) must be set to a
 *     non-empty value, otherwise importing this module throws. A missing prod
 *     URL becomes a loud boot error rather than a silent localhost fallback
 *     shipped to users. (CI should inject the URLs so the build/boot fails fast
 *     when they are absent.)
 *   - In dev / test the same vars fall back to the safe local defaults so
 *     `npm run dev` and the vitest suite work with an empty env.
 *
 * VITE_SENTRY_DSN is optional in every mode — Sentry stays a no-op when it is
 * unset (see src/utils/sentry.js).
 */

/**
 * Safe dev-only default for one var. Gated on `import.meta.env.DEV` written as
 * a DIRECT member access (no optional chaining) so Vite statically replaces it
 * with the literal `false` in a production build; Rollup then strips this whole
 * branch, so the `localhost:4100` / `localhost:5180` literals never reach the
 * prod bundle (the prod-bundle test asserts this). Using `import.meta.env?.DEV`
 * here would DEFEAT that replacement and leak the localhost strings. In prod
 * this returns '' and the caller throws on the empty value.
 *
 * @param {'GRAPHQL_URL'|'WS_URL'|'WREN_URL'} key
 * @returns {string}
 */
function devDefault(key) {
  if (!import.meta.env.DEV) return ''

  if (key === 'GRAPHQL_URL') {
    // Vite dev server proxies /graphql to the local API.
    return '/graphql'
  }

  if (key === 'WS_URL') {
    // wss + current host is a safe non-localhost shape; the committed dev .env
    // overrides this with ws://localhost:4100/graphql for local API work.
    return typeof window !== 'undefined' && window.location?.host
      ? `wss://${window.location.host}/graphql`
      : 'ws://localhost:4100/graphql'
  }

  // WREN_URL — standalone Wren product dev port.
  return 'http://localhost:5180'
}

/**
 * Resolve a required `VITE_` URL with fail-fast semantics.
 *
 * @param {string} name  the env var name (for the error message)
 * @param {string|undefined} rawValue  import.meta.env[name]
 * @param {'GRAPHQL_URL'|'WS_URL'|'WREN_URL'} key  dev-default selector
 * @returns {string}
 */
function resolveRequired(name, rawValue, key) {
  const value = typeof rawValue === 'string' ? rawValue.trim() : ''

  if (value) return value

  // In a production build a missing/empty required URL is a hard error: we do
  // not want to silently ship a localhost or current-host fallback.
  if (import.meta.env?.PROD) {
    throw new Error(
      `[config] Missing required env ${name}. ` +
        'Production builds must inject VITE_GRAPHQL_URL, VITE_WS_URL and ' +
        'VITE_WREN_URL (see .env.example).'
    )
  }

  return devDefault(key)
}

/** Validated GraphQL HTTP endpoint. */
export const GRAPHQL_URL = resolveRequired(
  'VITE_GRAPHQL_URL',
  import.meta.env?.VITE_GRAPHQL_URL,
  'GRAPHQL_URL'
)

/** Validated GraphQL WebSocket (subscriptions) endpoint. */
export const WS_URL = resolveRequired('VITE_WS_URL', import.meta.env?.VITE_WS_URL, 'WS_URL')

/** Validated base URL of the standalone Wren product (cross-app upsell). */
export const WREN_URL = resolveRequired('VITE_WREN_URL', import.meta.env?.VITE_WREN_URL, 'WREN_URL')

/** Optional Sentry DSN — empty string when unset (Sentry no-ops). */
export const SENTRY_DSN =
  (typeof import.meta.env?.VITE_SENTRY_DSN === 'string'
    ? import.meta.env.VITE_SENTRY_DSN.trim()
    : '') || ''

/**
 * Call-time GraphQL URL resolver for the token-refresh fetch.
 *
 * `refreshAccessToken` reads the URL when it runs (not at module init) so the
 * existing apollo unit tests can flip `VITE_GRAPHQL_URL` with `vi.stubEnv`
 * per call. Outside production this preserves the original
 * `VITE_GRAPHQL_URL || '/graphql'` behaviour; in production the value is
 * already validated as present at import via {@link GRAPHQL_URL}.
 * @returns {string}
 */
export function resolveGraphqlUrl() {
  const raw = import.meta.env?.VITE_GRAPHQL_URL
  const value = typeof raw === 'string' ? raw.trim() : ''
  // '/graphql' is a same-origin relative path (not a localhost literal), so it
  // is a safe call-time fallback in every mode and preserves the original
  // apollo `VITE_GRAPHQL_URL || '/graphql'` behaviour exercised by the tests.
  return value || '/graphql'
}
