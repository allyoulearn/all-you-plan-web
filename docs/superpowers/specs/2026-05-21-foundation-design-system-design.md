# All You Plan — Foundation: Design System & App Shells

**Date:** 2026-05-21
**Status:** Design approved, pending spec review
**Sub-project:** 1 of 7 — "all you plan" warm redesign
**Scope:** `all-you-plan-web` (Vue 3 + Vite + Tailwind) and `all-you-plan-mobile` (Expo + React Native + NativeWind). No `all-you-plan-api` changes.

## Program context

This is sub-project 1 of 7 in a full redesign and restructure of "all you plan", driven by a Claude Design handoff bundle — HTML/CSS/JS prototypes at `~/Downloads/all-you-plan/project/`. The bundle re-imagines the product as a warm, editorial personal projects-and-chores manager with an AI coach named "Wren", replacing the current Eisenhower-matrix task manager.

Three decisions frame the whole program:

1. **The warm Claude Design direction supersedes the previously approved "premium dark" redesign** (`docs/superpowers/specs/2026-05-21-premium-redesign-ai-assistant-design.md` and `docs/superpowers/plans/2026-05-21-premium-visual-redesign.md`). Those documents are archived as part of this sub-project.
2. **Full pivot** — both the UI and the GraphQL API / data model are reworked to the new domain.
3. **Web and mobile are built in parallel** — each sub-project is a vertical slice spanning both apps (and the API, from sub-project 2 on).

The 7 sub-projects, in build order:

1. **Foundation** — design system, theming, shared primitives, app shells (this spec).
2. **Today + core API** — new GraphQL schema/models for the core domain + the Today timeline screen.
3. **Chores** — cadences, streaks, completion history.
4. **Projects & Kanban** — projects, project tasks, kanban board.
5. **Wren** — the AI coach: chat panel/tab/sheet, the Today coach card, the Daily review.
6. **Reflection** — Calendar, Stats, Journal, Inbox.
7. **Settings** — theme / density / coach-personality / privacy preferences.

Each later sub-project gets its own spec → plan → implementation cycle and may reference this document for the design system.

## Overview

Foundation makes both apps boot into the new warm editorial design system with nothing feature-specific yet. When this sub-project is done:

- Both apps compile and run.
- The design tokens, three fonts, and 4-theme × 2-mode theming all work.
- A shared primitive component layer exists in each app.
- The web 3-column shell and the mobile tabbed shell are in place.
- Every route is registered and renders a themed placeholder screen, so both apps are fully navigable.
- The old Eisenhower-matrix UI is removed.
- The auth screens are re-themed to the warm look.

Feature screens, the Wren conversation logic, and any data-layer rework are explicitly out of scope — they belong to sub-projects 2–7.

## Decisions

| Topic | Decision |
| --- | --- |
| Design source | The Claude Design bundle at `~/Downloads/all-you-plan/project/`. Recreate visuals faithfully; do not copy prototype code structure. |
| DS architecture | Per-app, spec-synced. Each app implements tokens in its platform-native way; this spec is the canonical token reference. No shared package. |
| Themes | All 4 — Warm, Ink, Blueprint, Rose — each in light + dark (8 palettes), shipped now. |
| Default theme | Warm, light. |
| Icons | Heroicons throughout — `@heroicons/vue` (web), `react-native-heroicons` (mobile). Glyphs Heroicons lacks get a nearest-match substitute. |
| Dark-mode mechanism | CSS-variable swap on `[data-theme]` / `[data-mode]` (web); `ThemeProvider` + precomputed palettes (mobile). Tailwind `darkMode` is keyed to `[data-mode="dark"]` so the `dark:` variant stays available for edge cases. |
| Density | Ship "normal" only. The design's compact / cozy density variants are deferred to sub-project 7 (Settings). |
| Placeholder screens | Every route is scaffolded with a themed "coming soon" screen so both apps are fully navigable after Foundation. |
| Old UI | Old shell/layout + Eisenhower views and components are deleted now. Stores and GraphQL operations are left in place for sub-project 2 to rework. |

### Rejected alternatives

- **Shared tokens package / Style Dictionary** — rejected. The two apps are separate git repos with no monorepo or shared-package infrastructure; a published or linked package is real overhead for a small, already-finalized token set.
- **Warm-only theme set** — rejected. The design ships 4 themes, the Settings sub-project needs them, and every value is already known, so shipping all 4 now avoids a retrofit.
- **Porting the design's custom inline-SVG icon set** — rejected per the family `CLAUDE.md` "Heroicons only, no inline SVG" rule.
- **`dark:`-variant-only dark mode** — not viable; the `dark:` variant cannot express 4 themes × 2 modes. The CSS-variable swap is required and makes dark mode total automatically.

## Non-goals

- No feature-screen content — the Today timeline, chore lists, project boards, calendar, stats, journal, inbox (sub-projects 2–6).
- No `all-you-plan-api` or GraphQL schema changes.
- No Wren conversation logic — Foundation builds only the Wren panel/sheet chrome.
- No data-layer rework — existing Pinia/Zustand stores and Apollo operations stay until sub-project 2.
- No auth flow, validation, or auth-API changes — auth screens are re-themed only.
- The design's desktop/mobile "frame toggle" and the prototype "tweaks panel" are not ported; they are prototype/tooling artifacts.
- No internationalisation change — the existing i18n setup stays; new strings are English and follow the existing pattern.

## Section 1 — Token system

### Semantic tokens

Components reference token names only — never raw hex. A theme or mode switch recolors the whole app. The token roles:

- **Surfaces:** `paper` (app background), `paper-2` (cards, lists, raised surfaces), `paper-3` (hover state, inset surfaces).
- **Text:** `ink` (primary text; also the "primary button" fill), `ink-2` (secondary text), `muted` (tertiary text, labels).
- **Lines:** `rule` (strong rule, rarely used), `rule-soft` (borders and dividers — the workhorse).
- **Brand:** `accent`, `accent-ink` (text/icon on an accent fill).
- **Status:** `ok`, `warn`, `bad`.

### Color palettes (8)

`accent-ink` is `#ffffff` in every palette. Status colors are shared across all themes: `ok #2f7a3f`, `warn #c3a200`, `bad #b7351a`. Source of truth: the design bundle's `styles.css` (`:root`, `[data-theme]`, and `[data-mode="dark"][data-theme]` blocks). The web app ports those blocks verbatim; mobile precomputes the resolved values below.

**Warm** (default)

| Token | Light | Dark |
| --- | --- | --- |
| paper | #f7f3ea | #15130e |
| paper-2 | #ffffff | #1f1c15 |
| paper-3 | #efe9d8 | #2a2519 |
| ink | #1a1814 | #f3efe3 |
| ink-2 | #38332a | #c9c4b5 |
| muted | #756f63 | #8a857a |
| rule | #1a1814 | #efe9d7 |
| rule-soft | #e6dfca | #2e2a22 |
| accent | #ff5a1f | #ff6a2c |

**Ink**

| Token | Light | Dark |
| --- | --- | --- |
| paper | #f2efe6 | #0f100e |
| paper-2 | #fbfaf4 | #181a16 |
| paper-3 | #e6e0cd | #232520 |
| ink | #131311 | #ecebe3 |
| ink-2 | #2a2825 | #2a2825 |
| muted | #6e6a60 | #8a8a80 |
| rule | #131311 | #ecebe3 |
| rule-soft | #ddd5bf | #262822 |
| accent | #1c6a35 | #5fbf75 |

**Blueprint**

| Token | Light | Dark |
| --- | --- | --- |
| paper | #eef2f8 | #0b1220 |
| paper-2 | #ffffff | #131c2c |
| paper-3 | #dde4ee | #1c2638 |
| ink | #0c1a2e | #e9edf5 |
| ink-2 | #2a2825 | #2a2825 |
| muted | #5b6779 | #7e8aa0 |
| rule | #0c1a2e | #e9edf5 |
| rule-soft | #ccd5e2 | #1f2840 |
| accent | #2563eb | #7da4ff |

**Rose**

| Token | Light | Dark |
| --- | --- | --- |
| paper | #f6efe8 | #150f0f |
| paper-2 | #fdf9f4 | #1e1614 |
| paper-3 | #ead9cb | #2a1f1c |
| ink | #1a1010 | #f1e8e4 |
| ink-2 | #2a2825 | #2a2825 |
| muted | #80695f | #8c7c77 |
| rule | #1a1010 | #f1e8e4 |
| rule-soft | #e7d3c4 | #2c211e |
| accent | #d63b65 | #ff7a96 |

Note: Ink, Blueprint, and Rose do not redefine `ink-2`; they inherit the base value `#2a2825` in both light and dark. This mirrors `styles.css` exactly — port verbatim. A per-theme `ink-2` is a candidate refinement for a later polish pass, not Foundation work.

### Typography

Three families: **Instrument Sans** (UI/body), **Instrument Serif** (editorial display, numerals, and Wren's voice — used italic), **JetBrains Mono** (labels, eyebrows, timestamps, counts). Base body is 15px / line-height 1.35, antialiased.

Shared named scale (exact per-element sizes are ported from `styles.css` / `mobile.css`; this is the common vocabulary):

| Token | Family | Web px | Mobile px | Use |
| --- | --- | --- | --- | --- |
| display | serif | 56 (44 ≤1280px, 40 compact) | 38 / 30 | screen hero title |
| numeral | serif | 40–56 | 26–30 | KPI / stat figures |
| title | serif | 28 | 21 | card titles, coach title |
| heading | serif | 22 | 18–22 | Wren name, pull-quotes |
| body | sans | 15 | 14 | body text |
| body-sm | sans | 14 | 13 | dense body, inputs, list rows |
| label | sans | 13 | 12.5 | section headers, buttons, meta |
| caption | sans | 12 | 11.5 | eyebrows, KPI labels |
| micro | mono | 11 | 11 | counts, timestamps, tags |
| nav | mono | 10 | 10.5 | nav-section labels, tab labels |

Display/heading text is weight 400 with negative letter-spacing (-0.01em to -0.02em) and tight line-height (0.9–1.05). Italic serif is a signature: the emphasised word in every screen heading, the wordmark, and Wren's voice.

Fonts are loaded as real assets, not via CDN: web uses `@fontsource/instrument-sans`, `@fontsource/instrument-serif`, `@fontsource/jetbrains-mono`; mobile uses `expo-font` with `.ttf` files added to `assets/fonts/` (all three families are open-source on Google Fonts).

### Spacing, radius, shadow

- **Spacing scale:** 2 / 4 / 6 / 8 / 10 / 12 / 14 / 16 / 18 / 20 / 24 / 26 / 28 / 32 px. The density token `pad` is fixed at 20px for Foundation (compact 14 / cozy 28 are deferred to Settings).
- **Radius:** `sm` 10px, `md` 14px, `lg` 20px, `pill` 999px. Component-specific exceptions ported as-is: list row 8px, chat bubble 18px.
- **Shadow:** `sm` = `0 1px 2px rgba(20,18,12,0.04), 0 2px 8px rgba(20,18,12,0.04)`; `md` = `0 1px 2px rgba(20,18,12,0.05), 0 8px 24px rgba(20,18,12,0.06)`; `accent-glow` = `0 6px 24px color-mix(in oklab, var(--accent) 30%, transparent)`.
- **Layout tokens:** sidebar 232px (200 ≤1280px, 64 ≤960px), Wren panel 360px (320 ≤1280px, 280 ≤960px).

### Web mechanism

Tokens are CSS custom properties. The `:root`, `[data-theme]`, and `[data-mode="dark"][data-theme]` blocks from `styles.css` are ported into the web stylesheet (`src/assets/`). `[data-theme]` and `[data-mode]` attributes on `<html>` swap the active palette. `tailwind.config.mjs` maps utility names to `var(--token)`, so `bg-paper`, `text-ink`, `border-rule-soft`, `bg-accent` recolor automatically. `tailwind.config.mjs` `darkMode` is set to `['selector', '[data-mode="dark"]']` so the `dark:` variant remains available where a single token cannot express a needed difference.

A `useTheme` composable (replacing `useDarkMode.js`) holds `{ themeName, mode }`, writes the two attributes to `<html>`, and persists the choice to `localStorage`. The TopBar exposes a light/dark toggle; full theme selection UI lands in sub-project 7, but the composable supports all 4 themes now.

### Mobile mechanism

React Native has no CSS variables and no `color-mix()`. A `ThemeProvider` holds the 8 palettes as plain precomputed objects; any `color-mix()` color from the design is computed once at build time and stored as a flat hex value. A `useTheme()` hook returns the active palette plus the type/spacing/radius scales. Themed colors come from the hook (used with `StyleSheet` / dynamic styles); NativeWind utility classes are used for theme-invariant layout. Theme state (`themeName`, `mode`) lives in the existing `user.store.ts`, which already persists a `darkMode` preference.

`color-mix()` usages relevant to Foundation (precompute per palette): the accent-card / accent-bubble glow shadow (`accent` 30%), the Wren live-dot halo (`ok` 18%), and the active nav-item key color (`paper` 65%). Feature-screen mixes (streak-grid intensities, etc.) are handled by their own sub-projects.

## Section 2 — Shared primitives

A primitive layer built in **both** apps with matching component names and prop semantics — Vue SFCs in `all-you-plan-web/src/components/ui/`, React Native components in `all-you-plan-mobile/src/components/ui/`. This is exactly the set the shells, placeholder screens, and auth need; feature-specific compound components (the list row, KPI tile, chat bubble) ship with their feature sub-project, reusing these.

| Primitive | Purpose | Key props |
| --- | --- | --- |
| `Icon` | Heroicons wrapper with a semantic-name map | `name`, `size` (default 20 web / 22 mobile), `solid` (default false) |
| `Button` | Text button | `variant` (`default` / `primary` / `accent` / `ghost`), `size` (`sm` / `md`), `icon`, `iconTrailing`, `disabled`; label via slot/children |
| `IconButton` | Round icon-only button | `icon`, `size` (default 34 web / 38 mobile), `variant` (`default` / `ghost`), `disabled` |
| `TextField` | Themed text input | `modelValue`/`value`, `type`, `placeholder`, `disabled`, `invalid`, `label`, `icon` |
| `Card` | Surface container | `variant` (`default` / `accent`), `as` (element/tag); content via slot/children |
| `Pill` | Small label/tag chip (covers the design's `.tag` and `.pill`) | `variant` (`default` / `accent` / `soft` / `dot`); label via slot/children |
| `ProgressBar` | Linear progress | `value` (0–1), `thin` (boolean) |
| `Checkbox` | Round check toggle | `modelValue`/`checked`, `size` (default 20), `disabled` |
| `SegmentedControl` | Segmented button group | `modelValue`, `options` (`{ value, label, count? }[]`); emits `update` |
| `ScreenHeading` | Editorial screen title block | `eyebrow`, `title`, `emphasis` (trailing words set in italic serif); `meta` slot |
| `SectionHeader` | Section label with rule line | `label`, `count`; `action` slot |

### Icon name map

`Icon` resolves a semantic name to a Heroicon. Load-bearing mappings for Foundation's shells (others map 1:1 or nearest as needed):

| Semantic name | Heroicon | Note |
| --- | --- | --- |
| today | `HomeIcon` | Today nav/tab |
| chores | `ArrowPathIcon` | nearest match — the design's leaf has no Heroicon equivalent; the recurring/cycle glyph reads as cadence/habits |
| projects | `Squares2X2Icon` | matches the design's 2×2 glyph |
| wren | `SparklesIcon` | matches the design's sparkle |
| more | `EllipsisHorizontalIcon` | |
| calendar | `CalendarIcon` | |
| stats | `ChartBarIcon` | |
| journal | `BookOpenIcon` | |
| inbox | `InboxIcon` | |
| chat | `ChatBubbleLeftRightIcon` | |
| review | `ClipboardDocumentCheckIcon` | |
| settings | `Cog6ToothIcon` | |
| search | `MagnifyingGlassIcon` | |
| plus | `PlusIcon` | quick-add |
| check | `CheckIcon` | |
| chevron-left/right/down | `ChevronLeft/Right/DownIcon` | |
| moon / sun | `MoonIcon` / `SunIcon` | mode toggle |
| flag / mic / bolt | `FlagIcon` / `MicrophoneIcon` / `BoltIcon` | |

## Section 3 — Web app shell

Replaces the current `AppLayout` / `AppHeader` / `AppSidebar`. Components in `all-you-plan-web/src/components/layout/`.

- **`AppShell.vue`** — the 3-column CSS grid at `100vh`: sidebar `232px` / main `1fr` / Wren panel `360px`. Responsive: ≤1280px → 200 / 1fr / 320; ≤960px → 64 (icon-only sidebar) / 1fr / 280. The main column is the only scroll region; sidebar and panel scroll independently.
- **`AppSidebar.vue`** — the "all you *plan*" serif wordmark (italic "plan") + version tag; nav grouped into 4 labeled sections — **Workspaces** (Today, Chores, Projects), **Looking back** (Calendar, Stats, Journal, Inbox), **With Wren** (Chat, Daily review), **System** (Settings); each item shows a display-only keyboard-hint letter; a footer with the user avatar, name, and plan badge. Active item uses the `ink` fill / `paper` text treatment. Contextual project sub-nav ("Project: …", "Board view") is added in sub-project 4.
- **`AppTopBar.vue`** — sticky header inside the main column: breadcrumbs, current date, and three `IconButton`s (search, quick-add `plus`, light/dark mode toggle). The design's desktop/mobile frame toggle is not ported.
- **`WrenPanel.vue`** — the right column. Foundation builds the chrome only: a header (the "W" serif badge, "Wren" name, role line, green "live" dot with halo), an empty conversation body, and a footer with the pill input and quick-prompt chips. It renders an empty/idle state; the real conversation is wired in sub-project 5.

## Section 4 — Mobile app shell

Replaces the current `GlowTabBar`. The design's hardcoded 50px status bar and 34px home indicator become real safe-area insets via `react-native-safe-area-context`.

- **`app/(tabs)/_layout.tsx`** — an Expo Router `Tabs` navigator with five tabs: **Today** / **Chores** / **Projects** / **Wren** / **More**, headers hidden.
- **`TabBar`** (`src/components/shell/TabBar.tsx`) — the custom bottom tab bar: 5 tabs with `Icon` glyphs and labels, accent color on the active tab, a translucent blurred background (`expo-blur`), safe-area aware.
- **`WrenFab`** (`src/components/shell/WrenFab.tsx`) — a floating round button with a notification dot, positioned bottom-right above the tab bar, shown on every tab except Wren; tapping it opens the Wren sheet.
- **`WrenSheet`** (`src/components/shell/WrenSheet.tsx`) — the Wren bottom-sheet shell: slide-up animation, scrim, grab handle, header, an empty body, and the input bar. Content is wired in sub-project 5.
- **`app/_layout.tsx`** — root layout with `SafeAreaProvider`, the `ThemeProvider`, and the `(auth)` and `(tabs)` route groups.
- **More hub** (`app/(tabs)/more.tsx`) — a list screen linking to the six secondary detail screens.

## Section 5 — Routing & placeholder screens

Every route is registered and renders a `PlaceholderScreen` — the new shell plus a `ScreenHeading` and a brief "coming soon" note — so both apps are fully navigable immediately. Feature sub-projects replace stubs one at a time.

**Web** (`src/router/index.js`) — all non-auth routes render inside `AppShell`:

| Path | Screen |
| --- | --- |
| `/` | Today |
| `/chores` | Chores |
| `/projects` | Projects |
| `/projects/:id` | Project detail |
| `/projects/:id/board` | Kanban board |
| `/calendar` | Calendar |
| `/stats` | Stats |
| `/journal` | Journal |
| `/inbox` | Inbox |
| `/wren` | Chat with Wren |
| `/review` | Daily review |
| `/settings` | Settings |
| `/auth/*` | unchanged (login, register, forgot-password, reset-password) |

The existing auth guard and `document.title` logic are preserved. Old routes (`/spaces/:id`, `/briefing`) are removed.

**Mobile** (`app/`) — five tab screens (`index` = Today, `chores`, `projects`, `wren`, `more`) plus seven detail screens (project detail, calendar, stats, journal, inbox, review, settings) as stack routes reached from the More hub and Projects, mirroring the existing `space/[id]` routing pattern. Old screens (`matrix`, `spaces`, `space/[id]`, `task/[id]`) are removed.

## Section 6 — Removing the old UI

Foundation deletes the old shell and the Eisenhower-matrix UI. The data layer is **kept** — reworking it is sub-project 2's job, and ripping it out now only to rebuild it immediately would be churn.

**Web — delete:** `components/layout/AppLayout.vue`, `AppHeader.vue`, `AppSidebar.vue`; `views/DashboardView.vue`, `SpaceView.vue`, `BriefingView.vue`, `SettingsView.vue`; `components/dashboard/*`, `components/common/*` (GlassCard, ProgressRing, QuadrantBadge), `components/tasks/*`, `components/spaces/SpaceCard.vue`; `composables/useDarkMode.js`; `utils/quadrantColors.js`.

**Web — keep (logic untouched):** `api/*`, `stores/*`, `i18n/*`. **Modify:** `router/index.js`, `App.vue`, `main.js`, `index.html`, `assets/` styles, `tailwind.config.mjs`, and `views/auth/*` (re-themed per Section 7 — logic unchanged).

**Mobile — delete:** the `GlowTabBar` layout; `app/(tabs)/matrix.tsx`, `spaces.tsx`, `space/[id].tsx`, `task/[id].tsx`; `components/QuickAddModal.tsx`; `utils/quadrantConfig.ts` and its test `__tests__/quadrantConfig.test.ts`.

**Mobile — keep (logic untouched):** `api/*`, `stores/*` except `user.store.ts` (the domain stores are reworked in sub-project 2), `i18n/*`, `utils/storage.ts`. **Modify:** `app/_layout.tsx`, `app/(tabs)/*`, `app/(auth)/*` (re-themed per Section 7 — logic unchanged), `theme/*`, `hooks/useThemeColors.ts` (becomes/feeds `useTheme`), `stores/user.store.ts` (adds `themeName` to the existing UI-preference store), `tailwind.config.js`, `global.css`.

**Archiving:** move `docs/superpowers/specs/2026-05-21-premium-redesign-ai-assistant-design.md` and `docs/superpowers/plans/2026-05-21-premium-visual-redesign.md` into a new `docs/superpowers/archive/` folder. The partial dark-redesign code changes on the web app (the three-tier surface system, `surface-floating`/`radial-glow` utilities, `StatsRow`/`StatCard`/`ProgressRing`) are superseded — their files are covered by the delete/modify lists above.

## Section 7 — Auth retheme

The handoff bundle contains no auth mockups, so this is a faithful derivation of the warm system, not a pixel copy. Both apps:

- Background → `paper`; the form sits on a `paper-2` `Card`.
- The "all you *plan*" serif wordmark replaces the current "All You Plan" title; headings use `ScreenHeading`.
- Inputs become the `TextField` primitive; the primary action becomes an `accent` `Button`.
- Hardcoded backgrounds (e.g. mobile's `#0d1a2d`) are replaced with tokens; the screens render correctly in all 4 themes × 2 modes.

All auth logic, validation, flows, error handling, Google OAuth, and the demo login are unchanged. Web: `views/auth/AuthLayout.vue` + the 4 auth views. Mobile: `app/(auth)/_layout.tsx` + the 4 auth screens.

## File inventory

**Web — new:** `src/components/ui/*` (11 primitives); `src/components/layout/AppShell.vue`, `AppSidebar.vue`, `AppTopBar.vue`, `WrenPanel.vue`; `src/components/PlaceholderScreen.vue`; `src/views/*` placeholder views for the 12 routes; `src/composables/useTheme.js`; `src/assets/` token stylesheet; `vitest.config.*` + theme tests.

**Web — modified:** `tailwind.config.mjs`, `App.vue`, `main.js`, `router/index.js`, `index.html`, `views/auth/*` (re-theme), `package.json` (add `@fontsource/*`, `@heroicons/vue`, `vitest`). **Deleted:** see Section 6.

**Mobile — new:** `src/components/ui/*` (11 primitives); `src/components/shell/TabBar.tsx`, `WrenFab.tsx`, `WrenSheet.tsx`; `src/components/PlaceholderScreen.tsx`; `src/theme/*` (8 palettes, `ThemeProvider`, `useTheme`); placeholder route screens; `assets/fonts/*`; theme tests.

**Mobile — modified:** `app/_layout.tsx`, `app/(tabs)/*`, `app/(auth)/*` (re-theme), `stores/user.store.ts`, `hooks/useThemeColors.ts`, `tailwind.config.js`, `global.css`, `app.json` (font assets; fix the missing `icon.png` / `splash-icon.png` / `adaptive-icon.png` references flagged in the audit), `package.json` (add `react-native-heroicons`, `react-native-svg`, font assets). **Deleted:** see Section 6.

## Verification

The genuine logic in Foundation is theme resolution. Everything else is verified by running the apps.

- **Web:** add Vitest (the app has no test runner today). Unit-test `useTheme` — given `(themeName, mode)`, it sets the correct `data-theme` / `data-mode` attributes and a palette resolver returns the expected token values for all 8 palettes.
- **Mobile:** use the existing Jest setup. Unit-test the `useTheme()` palette resolver for all 8 palettes. (`quadrantConfig.test.ts` is removed with its source.)
- **Manual checklist (both apps):**
  1. The app compiles and runs with no console errors.
  2. It boots into the new shell (web 3-column, mobile tabbed).
  3. Every route/tab is reachable and renders its themed placeholder.
  4. Cycling all 4 themes × light/dark recolors every surface, text, and border — no hardcoded colors leak through.
  5. Auth screens render correctly in all 8 palettes.
  6. Old Eisenhower routes/screens are gone.
- Per the verification-before-completion practice, implementation reports must show the commands run and their output before any "done" claim.

## Risks

- **Token drift between the two apps.** Per-app, spec-synced means the palette values live in two places. Mitigation: this spec's palette tables are the single canonical reference; both apps port from them. A token-sync check can be added in a later sub-project if drift appears.
- **Font assets for mobile.** `expo-font` needs `.ttf` files. All three families are open-source on Google Fonts; the implementer fetches the files. Low risk.
- **`color-mix` precompute gaps on mobile.** A missed mix shows as a slightly-off color. Mitigation: Foundation's mix list is short and enumerated in Section 1; feature sub-projects own their own mixes.
- **Placeholder period.** Removing the old UI before feature screens exist means the apps show placeholders for several sub-projects. This is the intended phased outcome — each sub-project fills stubs — and both apps stay runnable throughout.
- **`darkMode` selector + variable swap interplay.** The `dark:` variant is available but the variable swap is primary; using `dark:` and a token swap for the same property could conflict. Mitigation: prefer tokens; reserve `dark:` for genuine exceptions and document any use.
