/**
 * Theme composable and initialiser.
 * Manages the application's active theme name and light/dark mode via
 * module-level singleton refs so that all consumers share one reactive state.
 *
 * `initTheme()` must be called once at app boot (before mounting) to hydrate
 * state from localStorage and apply the correct data attributes to
 * `<html>`.  `useTheme()` exposes the reactive state and mutation helpers to
 * any component or composable.
 */
import { ref } from 'vue'

// -- Constants --

/** Available visual themes. */
export const THEMES = ['warm', 'ink', 'blueprint', 'rose']

/** Available colour modes. */
export const MODES = ['light', 'dark']

const STORAGE_KEY = 'ayp-theme'

// -- Module-level singleton state --

const themeName = ref('warm')
const mode = ref('light')

// -- Internal helpers --

/**
 * Flush the current theme and mode to the DOM and localStorage.
 *
 * The DOM attributes are written first so the active session reflects the new
 * theme even when storage is unavailable (private browsing, quota exceeded).
 * The localStorage write is wrapped in try/catch so a storage failure does
 * not throw into the caller (`setTheme` / `setMode` / `toggleMode`) and turn
 * a theme toggle into a silent crash (WEB-W2-17).
 */
function apply() {
  const el = document.documentElement
  el.setAttribute('data-theme', themeName.value)
  el.setAttribute('data-mode', mode.value)
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ themeName: themeName.value, mode: mode.value })
    )
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn('[useTheme] failed to persist theme:', e?.message)
    }
  }
}

// -- Public API --

/**
 * Hydrate theme state from localStorage and apply attributes to `<html>`.
 * Call once at application boot, before mounting the Vue app.
 */
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

/**
 * Composable that exposes the shared theme state and mutation helpers.
 * @returns {{ themeName: import('vue').Ref<string>, mode: import('vue').Ref<string>, THEMES: string[], setTheme: (name: string) => void, setMode: (next: string) => void, toggleMode: () => void }}
 */
export function useTheme() {
  /**
   * Switch to the named theme. No-op if the name is not in THEMES.
   * @param {string} name - One of the values from {@link THEMES}
   */
  function setTheme(name) {
    if (!THEMES.includes(name)) return
    themeName.value = name
    apply()
  }

  /**
   * Switch to the given colour mode. No-op if the value is not in MODES.
   * @param {string} next - Either 'light' or 'dark'
   */
  function setMode(next) {
    if (!MODES.includes(next)) return
    mode.value = next
    apply()
  }

  /**
   * Toggle between light and dark mode.
   */
  function toggleMode() {
    setMode(mode.value === 'light' ? 'dark' : 'light')
  }

  return { themeName, mode, THEMES, setTheme, setMode, toggleMode }
}
