/**
 * Prod-bundle assertion test (G-12 step 6).
 *
 * Builds the app once with `vite build --mode production` into a temp dir,
 * with the three required VITE_ URLs set to dummy https values so the
 * src/config/env.js fail-fast passes, then asserts the emitted JS contains
 * none of the dev-only / mock / localhost strings. A single test covering:
 *   - W-AUTH-10 : dev sign-in stripped
 *   - W-XC-05   : mock billing + mock notifications stripped
 *   - W-XC-04   : no localhost in the bundle
 *
 * SLOW + OPT-IN: skipped unless RUN_BUILD_TESTS is set (see `npm run
 * test:build`), so the default `vitest run` stays fast.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RUN = !!process.env.RUN_BUILD_TESTS
const describeMaybe = RUN ? describe : describe.skip

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

/**
 * Strings owned by THIS gate (G-12 — env wiring / localhost + mock removal)
 * that must never appear in a production bundle. All of these are guaranteed
 * by changes in src/config/env.js, src/api/apollo.js, WrenCrossAppUpsell.vue,
 * and the DEV-gating of the mock link / fixtures.
 */
const FORBIDDEN = [
  'localhost:5180',
  'localhost:4100',
  'example.com/mock-checkout',
  'mock-customer-portal',
  'pickRandomNotification'
]

/**
 * Dev-login strings (W-AUTH-10). The dev quick-login control and its store
 * action are gated behind a DIRECT `import.meta.env.DEV` branch in
 * src/views/auth/LoginView.vue + src/stores/auth.store.js. Vite folds that
 * guard to `false` for a production build and Rollup strips the branch, so
 * neither the "Dev sign-in" button text nor the `devLogin` action identifier
 * reaches the prod bundle. The view renders the dev button as a render-function
 * component (not inline <template> markup) so the Vue compiler does not hoist
 * the button text as a static string constant that would survive the guard.
 */
const DEV_LOGIN_FORBIDDEN = ['Dev sign-in', 'devLogin']

describeMaybe('production bundle hygiene', () => {
  let bundleText = ''

  beforeAll(() => {
    const outDir = mkdtempSync(join(tmpdir(), 'ayp-web-dist-'))

    // Build a plain, sanitized env for the spawned build. vitest replaces
    // process.env with a proxy and loads the committed `.env` (which carries
    // ws://localhost:4100 + VITE_USE_MOCKS=true) into it; spreading that proxy
    // through execFileSync does not reliably carry our overrides, letting the
    // on-disk `.env` win. Stripping every VITE_* key first and then setting the
    // dummy prod URLs makes the build deterministic and independent of both the
    // vitest proxy and the committed dev `.env`.
    const childEnv = {}

    for (const [k, v] of Object.entries(process.env)) {
      if (!k.startsWith('VITE_')) childEnv[k] = v
    }

    // vitest runs the worker with NODE_ENV=test. Vite couples DEV/PROD to
    // NODE_ENV, so a spawned `vite build` that inherits NODE_ENV=test would
    // leave `import.meta.env.DEV` truthy and NOT strip dev-only dead code
    // (the env.js localhost defaults). Force production so the spawned build
    // matches a real CI prod build and the dead-code elimination actually runs.
    childEnv.NODE_ENV = 'production'
    childEnv.VITE_GRAPHQL_URL = 'https://api.example.com/graphql'
    childEnv.VITE_WS_URL = 'wss://api.example.com/graphql'
    childEnv.VITE_WREN_URL = 'https://wren.example.com'
    childEnv.VITE_USE_MOCKS = 'false'
    // Ensure no source-map upload is attempted during the test build.
    childEnv.SENTRY_AUTH_TOKEN = ''

    try {
      execFileSync(
        'npx',
        ['vite', 'build', '--mode', 'production', '--outDir', outDir, '--emptyOutDir'],
        {
          cwd: webRoot,
          stdio: 'pipe',
          env: childEnv
        }
      )

      const assetsDir = join(outDir, 'assets')
      const jsFiles = readdirSync(assetsDir).filter(f => f.endsWith('.js'))
      bundleText = jsFiles.map(f => readFileSync(join(assetsDir, f), 'utf8')).join('\n')
    } finally {
      rmSync(outDir, { recursive: true, force: true })
    }
  }, 180000)

  it('emits at least one JS asset', () => {
    expect(bundleText.length).toBeGreaterThan(0)
  })

  it.each(FORBIDDEN)('does not contain mock/localhost string: %s', needle => {
    expect(bundleText).not.toContain(needle)
  })

  // W-AUTH-10: the dev quick-login control + its store action are compile-time
  // dead in a prod build (DEV-gated render-function component + DEV-gated store
  // action). Assert they are fully stripped from the emitted bundle.
  it.each(DEV_LOGIN_FORBIDDEN)('does not contain dev-login string: %s', needle => {
    expect(bundleText).not.toContain(needle)
  })
})
