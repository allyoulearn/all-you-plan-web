# All You Plan — Sub-project 6: Reflection (Calendar, Stats, Journal, Inbox) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Checkbox (`- [ ]`) steps.

**Goal:** Build the Calendar, Stats, Journal, and Inbox screens on web and mobile, wired live to the existing API.

**Architecture:** Mirrors the SP2–SP5 pattern exactly — Apollo operations + per-domain stores + screens, on the Foundation primitives and the live API. UI-only; all four routes are Foundation placeholders.

**API contracts** (built — `2026-05-21-sp2-api.md` Tasks 7 & 9):
- `calendarEvents(month: String)` → `[CalendarEvent { id title date accent }]`
- `stats` → `{ heatmap: [Int!]! (182 values, intensity 0–3), rankedHabits: [{ choreId name streak bestStreak }] }`
- `journalEntries` → `[JournalEntry { id date prompt pullQuote body tags }]`; `createJournalEntry(date, prompt, pullQuote, body, tags)`
- `inboxItems(triaged: Boolean)` → `[InboxItem { id text source triaged capturedAt }]`; `createInboxItem(text, source)`; `triageInboxItem(id)`

**Design reference:** the Claude Design bundle — desktop `screens.jsx` Calendar / Stats / Journal / Inbox and mobile `mobile.jsx` `MCalendarScreen` / `MStatsScreen` / `MJournalScreen` / `MInboxScreen`.

**Inbox scope note:** the design shows four routing pills per item ("→ Today / → Project / → Chore / Archive"). This sub-project implements capture + a single **Triage** action per item (`triageInboxItem`); routing an item into an actual task/chore is a deferred follow-on. Build the row with one "Triage" `Button`.

Work on `main`, one commit per task. Reuse the SP2–SP5 store/operations/component patterns.

---

## Part A — Web (`all-you-plan-web`)

### Task A1: Reflection operations & stores
**Files:** Create `src/api/operations/{calendar,stats,journal,inbox}.js` and `src/stores/{calendar,stats,journal,inbox}.store.js`; modify `operations/index.js`.
- [ ] Create the four operations files with the `gql` documents for the contracts above; re-export all from `operations/index.js`.
- [ ] Create the four Pinia stores, each mirroring `today.store.js` (`load()` + the relevant create/triage actions): `calendar.store` (`events`, `load(month)`), `stats.store` (`stats`, `load()`), `journal.store` (`entries`, `load()`, `createEntry(...)`), `inbox.store` (`items`, `load()`, `capture(text)`, `triage(id)`).
- [ ] Verify `npm run build`; commit `feat: reflection operations and stores`.

### Task A2: Calendar screen
**Files:** Overwrite `src/views/CalendarView.vue`.
- [ ] On mount `calendar.store.load(currentMonth)`. Render `ScreenHeading` ("May", "2026."); a month navigation row (prev/next `IconButton`s + a serif-italic month label); a 7-column calendar grid (`bg-paper-2` `Card`) — weekday headers then 6 rows of day cells, adjacent-month days dimmed, today's cell `accent`-background, each cell showing up to 3 event dots (accent dot for `accent` events); and below, an agenda list for the selected day (default today) listing that day's events (mono time-less rows: title + an accent background for `accent` events). Selecting a day updates the agenda.
- [ ] Verify `npm run build`; commit `feat: live Calendar screen`.

### Task A3: Stats screen
**Files:** Overwrite `src/views/StatsView.vue`; create `src/components/stats/Heatmap.vue`.
- [ ] `Heatmap.vue` — props `{ values }` (the 182-int array). A `grid` of 26 columns × 7 rows of small squares; each square's background is `paper-3` for 0, and `accent` at 25% / 55% / 100% opacity for intensity 1 / 2 / 3 (use Tailwind arbitrary `bg-accent/[0.25]` etc.). A small "less … more" legend.
- [ ] `StatsView.vue` — on mount `stats.store.load()`. `ScreenHeading` ("Six months of", "showing up."); a `SectionHeader` "Activity grid" + a `Card` containing `Heatmap`; a `SectionHeader` "Habits ranked" + a list of rows (2-digit mono rank, habit name + "{streak} days · best {bestStreak}" sub, a right-aligned mono streak).
- [ ] Verify `npm run build`; commit `feat: live Stats screen`.

### Task A4: Journal screen
**Files:** Overwrite `src/views/JournalView.vue`.
- [ ] On mount `journal.store.load()`. `ScreenHeading` ("Notes to", "yourself."); a "Today's prompt" `Card` — an eyebrow, a serif-italic prompt (a fixed string), a serif `<textarea>` bound to local state, and a "Save entry" `Button` that calls `journal.store.createEntry({ date: today, body: <textarea>, pullQuote: first ~8 words of body, tags: [] })` then clears the textarea; then the entries list — each entry a 2-column row (mono date with a serif-italic day number; serif-italic `pullQuote`, body paragraph, tag `Pill`s).
- [ ] Verify `npm run build`; commit `feat: live Journal screen`.

### Task A5: Inbox screen
**Files:** Overwrite `src/views/InboxView.vue`.
- [ ] On mount `inbox.store.load()`. `ScreenHeading` ("Triage,", "don't think."); a capture `Card` — a full-width text `input` + a "Capture" `Button` that calls `inbox.store.capture(text)` then clears; a `SectionHeader` "To triage" + a list of untriaged items, each row showing a 2-digit mono index, the item text, the `source`, the relative `capturedAt`, and a "Triage" `Button` calling `inbox.store.triage(id)`.
- [ ] Verify `npm run build`; commit `feat: live Inbox screen`.

### Task A6: Web verification
- [ ] `npm run test:unit` (pass) + `npm run build` (clean). Fix any failure, commit with `fix:`.

---

## Part B — Mobile (`all-you-plan-mobile`)

### Task B1: Reflection operations & stores
**Files:** Create `src/api/operations/{calendar,stats,journal,inbox}.ts` and `src/stores/{calendar,stats,journal,inbox}.store.ts`; modify the barrels.
- [ ] The same `gql` documents as web A1; four Zustand stores mirroring `today.store.ts` (with typed interfaces for `CalendarEvent`, `StatsView`, `JournalEntry`, `InboxItem`). Re-export from both barrels.
- [ ] Verify `npx tsc --noEmit`; commit `feat: reflection operations and stores`.

### Task B2: Calendar screen
**Files:** Overwrite `app/(tabs)/calendar.tsx`.
- [ ] On mount `load(currentMonth)`. A `paper` `ScrollView` (safe-area top): a back row (chevron-left `IconButton` → `router.back()`); `ScreenHeading` ("May" / "2026."); a month-nav row; a 7-column calendar grid of circular day cells (dim adjacent month, accent today, event dots); an agenda section for the selected day. 100-unit bottom spacer.
- [ ] Verify `npx tsc --noEmit`; commit `feat: live Calendar screen`.

### Task B3: Stats screen
**Files:** Overwrite `app/(tabs)/stats.tsx`; create `src/components/stats/Heatmap.tsx`.
- [ ] `Heatmap.tsx` — props `{ values }`; a 26-column row of 7-tall columns of small squares, intensity colors precomputed from the theme `accent` (use `useTheme()`; for the 25%/55% tints, render the square with `accent` background at `opacity` 0.25 / 0.55 / 1, or precompute — opacity on a `View` is simplest).
- [ ] `stats.tsx` — back row; `ScreenHeading` ("Six months of" / "showing up."); a 3-tile KPI strip (Streak / Best / Habits — derive from `rankedHabits`); an activity `Card` with the `Heatmap` + legend; a "Habits ranked" `SectionHeader` + ranked rows. Bottom spacer.
- [ ] Verify `npx tsc --noEmit`; commit `feat: live Stats screen`.

### Task B4: Journal screen
**Files:** Overwrite `app/(tabs)/journal.tsx`.
- [ ] Back row; `ScreenHeading` ("Notes to" / "yourself."); a prompt `Card` with an eyebrow, a serif-italic prompt, a serif `TextInput` (multiline), and a "Save entry" `Button` calling `createEntry`; the entries list (date block, serif-italic pull-quote, body, tag `Pill`s). Bottom spacer.
- [ ] Verify `npx tsc --noEmit`; commit `feat: live Journal screen`.

### Task B5: Inbox screen
**Files:** Overwrite `app/(tabs)/inbox.tsx`.
- [ ] Back row; `ScreenHeading` ("Triage," / "don't think."); a capture row (pill `TextInput` + a circular `plus` `IconButton` calling `capture`); a "To triage" `SectionHeader` + a list of `InboxItem` cards (source + relative `capturedAt`, the text, a "Triage" `Button` calling `triage`). Bottom spacer.
- [ ] Verify `npx tsc --noEmit`; commit `feat: live Inbox screen`.

### Task B6: Mobile verification
- [ ] `npx tsc --noEmit` (clean) + `npm test` (palette suite passes). Fix any failure, commit with `fix:`.

---

## Notes
- The mobile detail screens are reached from the "More" hub (already built in Foundation) — no nav changes needed.
- `journal` prompt text and the calendar's "selected day" default to today; the prompt string is a fixed editorial line.
- Reuse `KpiTile`/`KpiRow` from `src/components/today/` for the Stats KPI strip rather than duplicating.
