/**
 * Sentry init for the Vue web app (Phase 4 Item D).
 *
 * Scaffold mirrors the API helper — no-op when VITE_SENTRY_DSN is unset
 * so dev / test stays free of network calls and SDK weight. The follow-up
 * SDK PR should:
 *   - npm i @sentry/vue
 *   - Replace the body of initSentry with Sentry.init({ app, dsn, ... })
 *   - Replace captureException with Sentry.captureException
 *
 * Consent gating: even with a DSN configured, init only fires when the
 * user has accepted the analytics bucket in the cookie banner (see
 * src/utils/cookieConsent.js). The web composables call captureException
 * directly; the no-op path keeps the call site honest before the SDK
 * lands.
 */
import { hasConsentFor } from './cookieConsent.js'

let initialised = false

export function initSentry(app) {
  if (initialised) return
  const dsn = import.meta.env?.VITE_SENTRY_DSN

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

  initialised = true

  // Real Sentry init lands here. We deliberately keep this branch a
  // logger.warn so the swap is mechanical: `import * as Sentry from
  // '@sentry/vue'; Sentry.init({ app, dsn, environment, ... })`.
  if (import.meta.env?.DEV) {
    console.warn('[sentry] scaffold initialised (SDK swap pending)', {
      environment: import.meta.env?.MODE,
      app: !!app
    })
  }
}

export function captureException(err, context) {
  if (!initialised) {
    if (import.meta.env?.DEV) {
      console.warn('[sentry] captureException (disabled)', err, context)
    }

    return
  }

  if (import.meta.env?.DEV) {
    console.warn('[sentry] captureException (scaffold)', err, context)
  }
}
