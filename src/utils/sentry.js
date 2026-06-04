/**
 * Sentry init for the Vue web app (Phase 4 Item D / G-13).
 *
 * Real @sentry/vue init, gated twice:
 *   1. VITE_SENTRY_DSN must be set (no-op in dev/test/undecided otherwise).
 *   2. The user must have accepted the cookie-consent `analytics` bucket
 *      (see src/utils/cookieConsent.js). A DSN alone is NOT enough — this
 *      consent gate is load-bearing for privacy and must stay in place.
 *
 * captureException is safe to call from anywhere (apollo errorLink, etc.):
 * it no-ops until init has actually run, so callers don't need to know whether
 * the SDK is live.
 */
import * as Sentry from '@sentry/vue'
import { hasConsentFor } from './cookieConsent.js'
import { SENTRY_DSN } from '@/config/env.js'

let initialised = false

/**
 * Initialise Sentry for the given Vue app instance. Idempotent and double
 * consent-gated. Call once at startup (src/main.js).
 * @param {import('vue').App} app
 */
export function initSentry(app) {
  if (initialised) return

  const dsn = SENTRY_DSN

  if (!dsn) {
    if (import.meta.env?.DEV) {
      // Quiet log so a missing DSN in dev isn't alarming.
      console.warn('[sentry] DSN not set — disabled')
    }

    return
  }

  if (!hasConsentFor('analytics')) {
    if (import.meta.env?.DEV) {
      console.warn('[sentry] analytics consent not given — disabled')
    }

    return
  }

  Sentry.init({
    app,
    dsn,
    environment: import.meta.env?.MODE,
    release: import.meta.env?.VITE_RELEASE || undefined,
    integrations: [Sentry.browserTracingIntegration()],
    // Keep traffic light; bump per environment if richer tracing is needed.
    tracesSampleRate: 0.1,
    // Do not attach IPs / cookies / request bodies by default — Plan handles
    // user content that must not ride along in error reports.
    sendDefaultPii: false
  })

  initialised = true
}

/**
 * Report a caught error to Sentry. No-ops until initSentry has run (DSN set +
 * analytics consent), so this is always safe to call.
 * @param {unknown} err
 * @param {Record<string, unknown>} [context] attached as Sentry `extra`
 */
export function captureException(err, context) {
  if (!initialised) {
    if (import.meta.env?.DEV) {
      console.warn('[sentry] captureException (disabled)', err, context)
    }

    return
  }

  Sentry.captureException(err, context ? { extra: context } : undefined)
}
