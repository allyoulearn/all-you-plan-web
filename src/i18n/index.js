/**
 * Internationalisation setup.
 * Creates and configures the vue-i18n instance with all supported locales.
 * The active locale is persisted to localStorage under the key `ayp_locale`.
 * First-time visitors get a best-effort match against `navigator.language`,
 * falling back to `'en'` when nothing matches or storage is unavailable.
 *
 * Usage: `import i18n from '@/i18n/index.js'` or the named export `{ i18n }`.
 */
import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import es from './locales/es.json'
import ptBR from './locales/pt-BR.json'
import fr from './locales/fr.json'
import de from './locales/de.json'

/**
 * Supported locales with their native display names. The order here drives
 * the order shown in the Settings → Language picker.
 */
export const SUPPORTED_LOCALES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'pt-BR', name: 'Português' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' }
]

const SUPPORTED_CODES = SUPPORTED_LOCALES.map(l => l.code)
const STORAGE_KEY = 'ayp_locale'

/**
 * Match a raw browser locale string (e.g., `'es-MX'`, `'pt-PT'`) to one of
 * the supported codes. Returns `null` when there is no acceptable match so
 * the caller can fall back to the default.
 * @param {string} raw
 * @returns {string|null}
 */
function matchBrowserLocale(raw) {
  if (!raw) return null

  // Exact match (covers 'en', 'es', 'fr', 'de', 'pt-BR').
  if (SUPPORTED_CODES.includes(raw)) return raw

  const primary = raw.split('-')[0]

  // Primary-language match (e.g., 'es-MX' -> 'es', 'fr-CA' -> 'fr').
  if (SUPPORTED_CODES.includes(primary)) return primary

  // Portuguese is only shipped in the Brazilian variant for now; treat any
  // 'pt-*' as Brazilian Portuguese rather than dropping back to English.
  if (primary === 'pt') return 'pt-BR'

  return null
}

/**
 * Resolve the initial locale on app start. Saved choice wins; otherwise
 * detect from the browser; otherwise default to English.
 * @returns {string}
 */
function getInitialLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (SUPPORTED_CODES.includes(stored)) return stored
  } catch {
    // Storage unavailable (private mode / quota) — fall through to detection.
  }

  try {
    const detected = matchBrowserLocale(navigator?.language)
    if (detected) return detected
  } catch {
    // navigator unavailable in non-DOM contexts (tests) — fall through.
  }

  return 'en'
}

const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: 'en',
  messages: {
    en,
    es,
    'pt-BR': ptBR,
    fr,
    de
  }
})

/**
 * Persist the active locale to localStorage, update the i18n instance, and
 * mirror onto the document's `lang` attribute so screen readers and the
 * browser's spellcheck pick the right dictionary.
 * @param {string} code
 */
export function setLocale(code) {
  if (!SUPPORTED_CODES.includes(code)) return
  i18n.global.locale.value = code

  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    // Storage unavailable — locale is still set in memory for the session.
  }

  try {
    document.documentElement.setAttribute('lang', code)
  } catch {
    // Non-DOM context — ignore.
  }
}

// Sync <html lang> on first load so initial paint advertises the right
// language to assistive tech.
try {
  document.documentElement.setAttribute('lang', i18n.global.locale.value)
} catch {
  // Non-DOM context — ignore.
}

export { i18n }

export default i18n
