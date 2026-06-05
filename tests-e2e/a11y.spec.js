import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Accessibility (axe) gate for the load-bearing surfaces of the app.
 *
 * Runs @axe-core/playwright against the Wren chat, a project Kanban board, and
 * the Calendar (month + week) and fails the build on any violation whose impact
 * is `critical` or `serious`, tagged to WCAG 2.0/2.1 A + AA.
 *
 * Runs against the dev server in mock mode (see playwright.config.js) so no
 * GraphQL API is required. Each test authenticates first via the dev-only
 * "Dev sign-in (skip backend)" control that the login screen exposes when
 * VITE_USE_MOCKS=true.
 *
 * NOTE: browsers are NOT installed in this repo. Before running, CI (or a
 * developer) must run `npx playwright install --with-deps chromium`. This file
 * is the committed gate definition; install + execution is a CI/human step.
 */

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

/** Only critical/serious violations fail the gate (per the Accept criterion). */
function blocking(results) {
  return results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
}

/** Stable selector for the dev-only quick-login control on the login screen. */
const DEV_SIGN_IN = '[data-testid="dev-sign-in"]'

/**
 * Authenticate so the protected routes the axe gate crawls are reachable.
 *
 * Two paths land us in the authenticated app, and this helper tolerates both:
 *
 *  1. The router's first-navigation guard (src/router/index.js) calls
 *     `tryRestoreSession()`. In mock mode (VITE_USE_MOCKS=true) the
 *     `refreshToken` fixture always returns a valid session, so the guard
 *     authenticates us and bounces /auth/login straight to the app root. When
 *     that happens the login screen — and its dev button — never render.
 *  2. If that restore does NOT happen first, the login screen renders and we
 *     click the dev-only "Dev sign-in (skip backend)" control, which calls
 *     `authStore.devLogin()` and routes into the app.
 *
 * So we navigate to the login route, then wait for EITHER the dev button or an
 * already-authenticated URL, and only click the button when it actually showed.
 * The dev button carries a stable `data-testid` (and the `.login-view__dev`
 * class) inside LoginView's DEV-only branch — see src/views/auth/LoginView.vue.
 */
async function devSignIn(page) {
  await page.goto('/auth/login')

  const devButton = page.locator(DEV_SIGN_IN)
  const onAuthRoute = () => new URL(page.url()).pathname.startsWith('/auth')

  // Race the two outcomes: dev button visible vs. guard already redirected.
  await Promise.race([
    devButton.waitFor({ state: 'visible' }).catch(() => {}),
    page.waitForURL(url => !url.pathname.startsWith('/auth')).catch(() => {})
  ])

  // If we are still on /auth/login, the login screen rendered — use the
  // dev control to sign in and wait for it to route into the app.
  if (onAuthRoute()) {
    await devButton.waitFor({ state: 'visible' })
    await devButton.click()
  }

  await page.waitForURL(url => !url.pathname.startsWith('/auth'))
}

async function runAxe(page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  return results
}

test.beforeEach(async ({ page }) => {
  // The dev server boots on the first test and the axe crawl is heavy; give
  // each test headroom beyond the 30s default so a cold-start dev server does
  // not flake the sign-in step or the analyze() pass.
  test.setTimeout(90_000)
  await devSignIn(page)
})

test('Wren chat has no critical/serious a11y violations', async ({ page }) => {
  await page.goto('/wren')
  // Wait for the conversation log landmark added by the a11y gate.
  await page.locator('[role="log"]').first().waitFor()
  expect(blocking(await runAxe(page))).toEqual([])
})

test('Kanban board has no critical/serious a11y violations', async ({ page }) => {
  // p1 is a seeded mock project with a populated board (src/mocks/fixtures/projects.js).
  await page.goto('/projects/p1/board')
  await page.locator('[role="region"]').first().waitFor()
  expect(blocking(await runAxe(page))).toEqual([])
})

test('Calendar month view has no critical/serious a11y violations', async ({ page }) => {
  await page.goto('/calendar')
  await page.locator('[role="grid"]').first().waitFor()
  expect(blocking(await runAxe(page))).toEqual([])
})

test('Calendar week view has no critical/serious a11y violations', async ({ page }) => {
  await page.goto('/calendar')
  // Switch to the week time-grid (the segmented control exposes a Week option).
  await page.getByText('Week', { exact: true }).first().click()
  await page.locator('[role="grid"]').first().waitFor()
  expect(blocking(await runAxe(page))).toEqual([])
})

test('Kanban board is keyboard reachable and the move shortcut reorders a card', async ({
  page
}) => {
  await page.goto('/projects/p1/board')
  await page.locator('[role="region"]').first().waitFor()

  // Tab order reaches an interactive card.
  const firstCard = page.locator('.kanban-card').first()
  await firstCard.waitFor()
  const firstCardId = await firstCard.getAttribute('data-task-id')
  await firstCard.focus()
  await expect(firstCard).toBeFocused()

  // The keyboard move shortcut (Ctrl+ArrowRight) moves the card to the next
  // column — assert it no longer sits in its original column's list.
  const originColumn = page.locator('.kanban-view__column').first()
  await expect(originColumn.locator(`[data-task-id="${firstCardId}"]`)).toHaveCount(1)
  await firstCard.press('Control+ArrowRight')
  await expect(originColumn.locator(`[data-task-id="${firstCardId}"]`)).toHaveCount(0)
})

test('Calendar month grid is reachable with a single tab stop (roving tabindex)', async ({
  page
}) => {
  await page.goto('/calendar')
  await page.locator('[role="grid"]').first().waitFor()

  // Exactly one day cell is in the tab order at a time.
  const tabbableCells = page.locator('button.calendar-view__day-cell[tabindex="0"]')
  await expect(tabbableCells).toHaveCount(1)

  // Arrow keys roam the grid: focus the tab stop, move right, and confirm a
  // different cell is selected.
  await tabbableCells.first().focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('button.calendar-view__day-cell--selected')).toHaveCount(1)
})
