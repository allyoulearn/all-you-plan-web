import { describe, it, expect, beforeEach } from 'vitest'
import { useTheme, initTheme, THEMES, MODES } from '@/composables/useTheme.js'

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-mode')
    const t = useTheme()
    t.setTheme('warm')
    t.setMode('light')
  })

  it('setMode writes the data-mode attribute', () => {
    useTheme().setMode('dark')
    expect(document.documentElement.getAttribute('data-mode')).toBe('dark')
  })

  it('setMode is a no-op for unknown modes', () => {
    const { setMode, mode } = useTheme()
    setMode('purple')
    expect(mode.value).toBe('light')
    expect(document.documentElement.getAttribute('data-mode')).toBe('light')
  })

  it('toggleMode flips between light and dark', () => {
    const { toggleMode, mode } = useTheme()
    toggleMode()
    expect(mode.value).toBe('dark')
    toggleMode()
    expect(mode.value).toBe('light')
  })

  it('setTheme writes the data-theme attribute', () => {
    useTheme().setTheme('blueprint')
    expect(document.documentElement.getAttribute('data-theme')).toBe('blueprint')
  })

  it('setTheme rejects an unknown theme name', () => {
    const { setTheme, themeName } = useTheme()
    setTheme('rose')
    setTheme('not-a-theme')
    expect(themeName.value).toBe('rose')
  })

  it('setTheme persists the value to localStorage', () => {
    useTheme().setTheme('ink')
    const stored = JSON.parse(localStorage.getItem('ayp-theme'))
    expect(stored.themeName).toBe('ink')
  })

  it('setMode persists the value to localStorage', () => {
    useTheme().setMode('dark')
    const stored = JSON.parse(localStorage.getItem('ayp-theme'))
    expect(stored.mode).toBe('dark')
  })

  it('persists the choice and initTheme restores it', () => {
    const { setTheme, setMode } = useTheme()
    setTheme('rose')
    setMode('dark')
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-mode')
    initTheme()
    expect(document.documentElement.getAttribute('data-theme')).toBe('rose')
    expect(document.documentElement.getAttribute('data-mode')).toBe('dark')
  })

  it('initTheme uses defaults when localStorage is empty', () => {
    localStorage.clear()
    initTheme()
    expect(document.documentElement.getAttribute('data-theme')).toBe('warm')
    expect(document.documentElement.getAttribute('data-mode')).toBe('light')
  })

  it('initTheme ignores unknown theme names from localStorage', () => {
    localStorage.setItem('ayp-theme', JSON.stringify({ themeName: 'neon', mode: 'dark' }))
    initTheme()
    // unknown theme is ignored; mode is still applied
    expect(document.documentElement.getAttribute('data-mode')).toBe('dark')
    // themeName ref stays at its current value (was reset to 'warm' in beforeEach)
    expect(useTheme().themeName.value).toBe('warm')
  })

  it('initTheme ignores malformed JSON in localStorage', () => {
    localStorage.setItem('ayp-theme', 'not-valid-json')
    // Should not throw
    expect(() => initTheme()).not.toThrow()
    expect(document.documentElement.getAttribute('data-theme')).toBe('warm')
  })

  it('all consumers share the same singleton ref', () => {
    const a = useTheme()
    const b = useTheme()
    a.setTheme('ink')
    expect(b.themeName.value).toBe('ink')
  })

  it('exposes all four theme names', () => {
    expect(THEMES).toEqual(['warm', 'ink', 'blueprint', 'rose'])
  })

  it('exposes both mode values', () => {
    expect(MODES).toEqual(['light', 'dark'])
  })

  it('useTheme returns THEMES on the returned object', () => {
    const { THEMES: t } = useTheme()
    expect(t).toEqual(['warm', 'ink', 'blueprint', 'rose'])
  })
})
