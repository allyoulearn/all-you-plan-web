import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config.js'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['tests/**/*.{test,spec}.{js,ts}'],
      exclude: [...configDefaults.exclude, 'dist/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        all: true,
        include: ['src/**/*.{js,vue}'],
        exclude: ['src/main.js', 'src/api/operations/**', 'src/mocks/fixtures/**'],
        thresholds: { lines: 90, branches: 90, functions: 90, statements: 90 }
      }
    }
  })
)
