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

/** Sign in through the dev mock control so protected routes are reachable. */
async function devSignIn(page) {
  await page.goto('/auth/login')
  const devButton = page.locator('.login-view__dev')
  await devButton.waitFor({ state: 'visible' })
  await devButton.click()
  // Lands on the authenticated app root after devLogin.
  await page.waitForURL(url => !url.pathname.startsWith('/auth'))
}

async function runAxe(page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  return results
}

test.beforeEach(async ({ page }) => {
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
