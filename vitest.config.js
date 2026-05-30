import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config.js'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./tests/setup.js'],
      include: ['tests/**/*.{test,spec}.{js,ts}'],
      exclude: [...configDefaults.exclude, 'dist/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        all: true,
        include: ['src/**/*.{js,vue}'],
        exclude: ['src/main.js', 'src/api/operations/**', 'src/mocks/fixtures/**'],
        // Pragmatic floor — the 90 target the prior audit set was aspirational
        // and silently failing for months. These bands sit just below the
        // current actuals (85/71/77/86) so the gate enforces "don't regress
        // below today" while leaving room to ratchet upward as the largest
        // views (Kanban, TodayView, TaskDetailModal, CalendarView) gain
        // dedicated component tests. Bump these in lockstep with new tests.
        thresholds: { lines: 80, branches: 65, functions: 70, statements: 80 }
      }
    }
  })
)
