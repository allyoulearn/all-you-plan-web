/**
 * Vitest setup.
 *
 * Sets an active Pinia instance before every test so components that
 * touch any Pinia store via `useXStore()` (e.g. WrenOriginBadge) can be
 * mounted by component tests that previously didn't install Pinia.
 *
 * Calling `setActivePinia` alone is enough — Pinia's `useXStore()` reads
 * the active instance directly and does NOT require the app to register
 * pinia as a plugin. Tests that need a customised Pinia (e.g.
 * wren.store.test.js) still call `setActivePinia(createPinia())` in their
 * own beforeEach to override the default and bind their spies to the
 * stores returned from the new active instance.
 *
 * Also installs a vue-i18n instance globally for @vue/test-utils so any
 * SFC that calls `useI18n()` at the setup boundary can mount without the
 * `Need to install with 'app.use' function` error. Tests that exercise
 * locale-switching behaviour still create their own i18n instance and
 * pass it as a per-mount plugin, which overrides this global default.
 */
import { beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { config } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en }
})

config.global.plugins = [...(config.global.plugins ?? []), i18n]

/**
 * Many test files install their own vue-i18n instance to exercise locale
 * switching or to use the same English bundle in isolation. The global one
 * above makes `useI18n` at the setup boundary work for tests that don't
 * bother — but when both are layered onto the same app via
 * `config.global.plugins` + the test's own `plugins: [i18n]`, vue-i18n's
 * install hook re-registers its components (`i18n-t`, `i18n-n`, `i18n-d`)
 * and the `t` directive on the per-test app and triggers Vue's
 * "already registered" warning. The behaviour is correct (per-test instance
 * still wins for its own app); only the warnings are noise.
 *
 * Vue's `app.config.warnHandler` won't catch these — `app.component()` runs
 * during `app.use(i18n)` before any component is mounted, so Vue's `warn()`
 * helper finds no instance on the stack and falls back to `console.warn`
 * directly. Filtering at the console boundary is the surgical fix.
 */
const originalConsoleWarn = console.warn

console.warn = (...args) => {
  const first = args[0]

  if (
    typeof first === 'string' &&
    first.startsWith('[Vue warn]:') &&
    (first.includes('has already been registered in target app') ||
      first.includes('Directive "t" has already been registered'))
  ) {
    return
  }

  originalConsoleWarn(...args)
}

/**
 * jsdom prints `Not implemented: navigation to another Document` whenever
 * code touches `window.location.assign` / `location.href = '…'` — which
 * the Apollo auth-error link does as its last-resort fallback when the
 * router fails to load. The navigation never matters in unit tests, and
 * jsdom routes the message through its own virtualConsole rather than
 * the global console, so a console.error filter wouldn't catch it.
 * Replace the offending APIs with no-ops at the window level instead.
 */
if (typeof window !== 'undefined' && window.location) {
  try {
    window.location.assign = () => {}
    window.location.replace = () => {}
  } catch {
    // jsdom may have already locked down location; we tried.
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
})
