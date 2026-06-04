import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { createRequire } from 'node:module'

/**
 * Load the Sentry source-map upload plugin only when the build has the
 * credentials (CI / production). Skipped in dev and in any build without an
 * auth token, so local `vite build` and the test runner stay self-contained.
 *
 * Loaded via a guarded synchronous require so the exported config stays a
 * plain object (vitest.config.js merges it with mergeConfig, which rejects a
 * callback form) AND so the config still loads before `@sentry/vite-plugin`
 * is installed (treat a missing module as pending-install).
 * @returns {import('vite').PluginOption[]}
 */
function sentryPlugins() {
  const authToken = process.env.SENTRY_AUTH_TOKEN
  if (!authToken) return []

  try {
    const require = createRequire(import.meta.url)
    const { sentryVitePlugin } = require('@sentry/vite-plugin')
    return [
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken,
        release: { name: process.env.VITE_RELEASE || undefined }
      })
    ]
  } catch (err) {
    console.warn(
      '[vite] @sentry/vite-plugin not available — skipping source-map upload:',
      err?.message
    )

    return []
  }
}

export default defineConfig({
  plugins: [vue(), ...sentryPlugins()],
  // Source maps are required for readable (symbolicated) Sentry stack traces.
  // The Sentry vite plugin uploads them; emit them so the upload has input.
  build: {
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      scss: { api: 'modern-compiler' }
    }
  },
  server: {
    port: 3100,
    open: true,
    proxy: {
      '/graphql': {
        target: 'http://localhost:4100',
        changeOrigin: true,
        ws: true
      }
    }
  }
})
