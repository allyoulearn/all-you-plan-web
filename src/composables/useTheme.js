import { ref } from 'vue'

export const THEMES = ['warm', 'ink', 'blueprint', 'rose']
export const MODES = ['light', 'dark']
const STORAGE_KEY = 'ayp-theme'

const themeName = ref('warm')
const mode = ref('light')

function apply() {
  const el = document.documentElement
  el.setAttribute('data-theme', themeName.value)
  el.setAttribute('data-mode', mode.value)
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ themeName: themeName.value, mode: mode.value }),
  )
}

export function initTheme() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (saved && THEMES.includes(saved.themeName)) themeName.value = saved.themeName
    if (saved && MODES.includes(saved.mode)) mode.value = saved.mode
  } catch {
    // ignore malformed storage
  }
  apply()
}

export function useTheme() {
  function setTheme(name) {
    if (!THEMES.includes(name)) return
    themeName.value = name
    apply()
  }
  function setMode(next) {
    if (!MODES.includes(next)) return
    mode.value = next
    apply()
  }
  function toggleMode() {
    setMode(mode.value === 'light' ? 'dark' : 'light')
  }
  return { themeName, mode, THEMES, setTheme, setMode, toggleMode }
}
