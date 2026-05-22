import { describe, it, expect, beforeEach } from 'vitest'
import { useTheme, initTheme, THEMES } from '@/composables/useTheme.js'

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

  it('exposes all four theme names', () => {
    expect(THEMES).toEqual(['warm', 'ink', 'blueprint', 'rose'])
  })
})
