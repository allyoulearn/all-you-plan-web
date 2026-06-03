/**
 * Cookie consent storage helper (Phase 4 Item C).
 *
 * Stores the user's banner choice in localStorage under a single key,
 * shaped as `{ version, decidedAt, buckets }` so a future banner v2 can
 * detect a stale choice and re-prompt without losing prior decisions.
 *
 * Three buckets:
 *   - essential: always on, not user-controllable (covers the auth
 *     cookie). Surfaced in the banner copy so the user knows they exist.
 *   - analytics: gates Sentry init + any future product-analytics SDK.
 *     Off by default; explicit accept-all flips this true.
 *   - marketing: gates ad SDKs / marketing pixels. Off by default,
 *     unused today (Plan does not ship marketing pixels), kept here so
 *     the contract is ready when it does.
 *
 * The banner component (CookieConsentBanner.vue) is the only writer; the
 * Sentry init / future analytics inits are the only readers via
 * `hasConsentFor(bucket)`.
 */

const STORAGE_KEY = 'ayp_cookie_consent'
const CURRENT_VERSION = 1

const DEFAULT_BUCKETS = {
  essential: true,
  analytics: false,
  marketing: false
}

/**
 * Read the persisted consent record from localStorage. Returns null when
 * the user has not yet seen the banner (so the banner knows to render)
 * or when the persisted version is older than CURRENT_VERSION (re-prompt
 * after a buckets schema change).
 */
export function getConsentRecord() {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.version !== CURRENT_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

/** True if the banner has been answered (any choice). */
export function hasDecided() {
  return getConsentRecord() !== null
}

/**
 * True when the user accepted the given bucket. Defaults to false on the
 * undecided state so a missing consent never accidentally enables an SDK.
 */
export function hasConsentFor(bucket) {
  const record = getConsentRecord()
  if (!record) return false
  return record.buckets?.[bucket] === true
}

/**
 * Persist the user's decision. The banner calls this with either the
 * "accept all" or "essential only" shape, or a per-bucket map if a future
 * granular UI is added.
 */
export function setConsent(buckets) {
  if (typeof window === 'undefined') return

  const record = {
    version: CURRENT_VERSION,
    decidedAt: new Date().toISOString(),
    buckets: { ...DEFAULT_BUCKETS, ...buckets, essential: true }
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
}

/** Convenience: accept all non-essential buckets. */
export function acceptAll() {
  setConsent({ analytics: true, marketing: true })
}

/** Convenience: deny everything optional, keep essential. */
export function essentialOnly() {
  setConsent({ analytics: false, marketing: false })
}
