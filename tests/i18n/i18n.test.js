import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('i18n/index.js', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  // -- getSavedLocale: happy path --

  it('uses the stored locale when it is a supported value', async () => {
    localStorage.setItem('ayp_locale', 'en')
    const { default: i18n } = await import('@/i18n/index.js')
    expect(i18n.global.locale.value).toBe('en')
  })

  it('falls back to "en" when localStorage is empty', async () => {
    const { default: i18n } = await import('@/i18n/index.js')
    expect(i18n.global.locale.value).toBe('en')
  })

  it('falls back to "en" when the stored value is not a supported locale', async () => {
    localStorage.setItem('ayp_locale', 'xx-YY')
    const { default: i18n } = await import('@/i18n/index.js')
    expect(i18n.global.locale.value).toBe('en')
  })

  it('falls back to "en" when the stored value is an empty string', async () => {
    localStorage.setItem('ayp_locale', '')
    const { default: i18n } = await import('@/i18n/index.js')
    expect(i18n.global.locale.value).toBe('en')
  })

  // -- getSavedLocale: localStorage unavailable --

  it('falls back to "en" when localStorage throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    const { default: i18n } = await import('@/i18n/index.js')
    expect(i18n.global.locale.value).toBe('en')
    vi.restoreAllMocks()
  })

  // -- i18n instance configuration --

  it('exports a named i18n export matching the default', async () => {
    const module = await import('@/i18n/index.js')
    expect(module.i18n).toBeDefined()
    expect(module.i18n).toBe(module.default)
  })

  it('is configured with legacy: false (Composition API mode)', async () => {
    const { default: i18n } = await import('@/i18n/index.js')
    // In legacy:false mode the locale is a Ref, not a plain string
    expect(typeof i18n.global.locale.value).toBe('string')
  })

  it('has "en" as the fallback locale', async () => {
    const { default: i18n } = await import('@/i18n/index.js')
    expect(i18n.global.fallbackLocale.value).toBe('en')
  })

  // -- English locale messages are loaded --

  it('resolves auth.login key to English text', async () => {
    const { default: i18n } = await import('@/i18n/index.js')
    expect(i18n.global.t('auth.login')).toBe('Sign in')
  })

  it('resolves settings.title key to English text', async () => {
    const { default: i18n } = await import('@/i18n/index.js')
    expect(i18n.global.t('settings.title')).toBe('Settings')
  })

  it('resolves common.loading key to English text', async () => {
    const { default: i18n } = await import('@/i18n/index.js')
    // harmonised to the ellipsis glyph so views can reuse one key.
    expect(i18n.global.t('common.loading')).toBe('Loading…')
  })

  it('returns the key itself for unknown keys (fallback behaviour)', async () => {
    const { default: i18n } = await import('@/i18n/index.js')
    // vue-i18n returns the key when no translation is found in non-strict mode
    const result = i18n.global.t('this.key.does.not.exist')
    expect(result).toBe('this.key.does.not.exist')
  })
})
