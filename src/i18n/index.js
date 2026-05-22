/**
 * Internationalisation setup.
 * Creates and configures the vue-i18n instance with the English locale.
 * The active locale is persisted to localStorage under the key `ayp_locale`.
 * Falls back to `'en'` when localStorage is unavailable or the stored value is
 * not a supported locale.
 *
 * Usage: `import i18n from '@/i18n/index.js'` or the named export `{ i18n }`.
 */
import { createI18n } from 'vue-i18n'
import en from './locales/en.json'

/** Supported locale codes. */
const SUPPORTED_LOCALES = ['en']

/**
 * Read the persisted locale from localStorage with a safe try/catch.
 * Returns `'en'` if localStorage is unavailable or the stored value is not a
 * supported locale.
 * @returns {string}
 */
function getSavedLocale() {
  try {
    const stored = localStorage.getItem('ayp_locale')
    return SUPPORTED_LOCALES.includes(stored) ? stored : 'en'
  } catch {
    return 'en'
  }
}

const i18n = createI18n({
  legacy: false,
  locale: getSavedLocale(),
  fallbackLocale: 'en',
  messages: { en }
})

export { i18n }
export default i18n
