# All You Plan — Sub-project 2: Today Screen & Full API Rebuild

**Date:** 2026-05-21
**Status:** Design approved, pending spec review
**Sub-project:** 2 of 7 — "all you plan" warm redesign
**Scope:** `all-you-plan-api` (clean-room rebuild), `all-you-plan-web` and `all-you-plan-mobile` (Today screen + data layer). Builds on sub-project 1 (Foundation).

## Program context

This is sub-project 2 of 7. Sub-project 1 (Foundation) delivered the warm design system, shared primitives, app shells, and placeholder screens in both apps.

Two scoping decisions, made with the user, shape this sub-project and the rest of the program:

1. **The full domain model is built now**, not incrementally per feature.
2. **The API is rebuilt clean-room** — every file authored fresh (server bootstrap, auth, all domains); nothing carried over from the current Eisenhower-shaped API.

Consequently:
- Sub-project 2 = the **complete new GraphQL API** + the **Today** screen on web and mobile.
- Sub-projects 3–7 (Chores, Projects, Wren, Reflection, Settings) become **UI-only** — their screens, wired to an API that already exists after this sub-project.

The current `all-you-plan-api` is a TypeScript / Apollo Server 4 / Express / Mongoose stack with five Eisenhower-shaped domains (`auth`, `spaces`, `tasks`, `briefings`, `nudges`). It is replaced wholesale.

## Overview

When this sub-project is done:
- `all-you-plan-api` runs a freshly authored GraphQL API for the new "all you plan" domain — server, JWT auth, nine domains, resolvers, and seed data.
- Both apps' Today placeholder screens are replaced with the real, live Today screen.
- The old Eisenhower data layer (Apollo operations, Pinia/Zustand stores) is removed; the Today slice is wired to the new API.
- The demo login still works against fresh seed data.

The feature screens for Chores, Projects, Calendar, Stats, Journal, Inbox, Wren, Daily review, and Settings are **not** built here — but the API that backs them is. Those screens are sub-projects 3–7.

## Decisions

| Topic | Decision |
| --- | --- |
| API rework | Clean-room rebuild — every file authored fresh. Same proven stack (TypeScript, Apollo Server 4, Express, Mongoose/MongoDB, GraphQL schema-first), no carried-over code. |
| Domain scope | The full new domain model — all nine domains (models, schemas, resolvers, services) plus a derived stats query — is built in this sub-project. |
| Auth | Re-implemented from scratch, but keeps the same GraphQL operation contract (`register`/`login`/`refreshToken`/`logout`/`me`/`updateProfile`/`forgotPassword`/`resetPassword`/`googleLogin`) so the apps' auth stores need only minor adjustment. JWT two-token, bcrypt, per-`userId` document scoping. |
| Task model | One unified `Task` collection is the spine — it serves the Today timeline (`scheduledDate`), project kanban boards (`projectId` + `column`), and chore occurrences (`choreId`). |
| Stats & KPIs | Derived at query time from Task/Chore completion history — not stored collections. |
| Today screen | Built live against the new API in both apps. |
| Old data layer | The Eisenhower Apollo operations and stores are deleted; the Today slice is rewired. Auth stores stay (contract-compatible). |
| Plans | This sub-project splits into 3 implementation plans — API, web, mobile — built in that order. |

### Rejected alternatives

- **Rework the API in place** — rejected by the user in favour of a clean-room rebuild.
- **Build only the Today slice of the API now** — rejected; the user chose to build the full domain model up front so sub-projects 3–7 are UI-only.
- **Separate `Task` and project/chore task collections** — rejected; one unified `Task` with optional `projectId`/`column`/`choreId` keeps the Today timeline a single query and avoids cross-collection aggregation.

## Non-goals

- No feature screens beyond Today (Chores, Projects, Calendar, Stats, Journal, Inbox, Wren, Daily review, Settings screens are sub-projects 3–7).
- No Wren AI behavior — sub-project 2 builds the Wren conversation **storage** model and basic message queries/mutations only; the coach's intelligence is sub-project 5.
- No data migration — the new model fully replaces the old; fresh seed data is generated. (The current API points at a MongoDB Atlas database; the rebuild targets a fresh database — see Seed data.)
- No real geolocation sunrise/sunset service — those values on the Today header are static/seeded.
- No new auth features — re-implementation is functionally equivalent to today's auth.

## Section 1 — The API: stack, server, auth

`all-you-plan-api/src/` is authored fresh. The stack is unchanged (it is sound): TypeScript (ESM, strict), Apollo Server 4 on Express 4, Mongoose 8 / MongoDB, `graphql-ws` subscriptions, schema-first SDL merged per domain.

**Server bootstrap** (`src/index.ts`, `src/config/`): Zod-validated env, Mongoose connection, Express app with `helmet` + `cors` (origin `http://localhost:3100` for web) + `cookie-parser`, Apollo Server mounted at `/graphql`, a `graphql-ws` `WebSocketServer` on the same path, a `GET /health` route, production error masking. Port `4100`.

**Auth** (`src/domains/auth/` + `src/config/auth.ts` + `src/middleware/auth.ts`): JWT two-token — a short-lived access token (`Authorization: Bearer`) and a refresh token in an httpOnly cookie, with `tokenVersion` invalidation. `bcryptjs` hashing. A `buildContext` that resolves the current user, and a `requireAuth(context)` guard. Operations: `register`, `login`, `refreshToken`, `logout`, `me`, `updateProfile`, `forgotPassword`, `resetPassword`, `googleLogin` (active only when `GOOGLE_CLIENT_ID` is set). This matches the current API's auth contract so the apps' auth stores need only minor field adjustments.

**Domain structure:** each domain is a folder under `src/domains/` with `model.ts` (Mongoose), `schema.graphql` (SDL), `resolvers.ts`, and `service.ts` where logic warrants. `src/index.ts` merges the SDL and resolver maps. Authorization is "is authenticated" + per-`userId` document scoping (no roles).

## Section 2 — The domain model

Nine domains, plus a derived `stats` query. Every collection has a `userId` (owner) and Mongoose `timestamps`. GraphQL types expose `id` and ISO-string dates.

### auth — `User`
- Auth: `email` (unique, lowercase), `passwordHash` (bcrypt, `select:false`), `name`, `tokenVersion`, `resetToken`/`resetTokenExpiry` (`select:false`), `googleId` (sparse).
- `timezone` (default `America/New_York`).
- `streak`: `{ current: Int, best: Int, lastCompletionDate: Date }`.
- `settings`: `{ theme: warm|ink|blueprint|rose, mode: light|dark, density: compact|normal|cozy, coachPersonality: gentle|direct|reflective, checkIns: [morning|midday|evening|stuck], stalledNudgeDays: Int|null, journalVisibility: private|themed|open }`.
- The GraphQL `User` type exposes profile, `streak`, and `settings` — never the auth secrets.

### tasks — `Task` (the spine)
- `title`, `note` (string, optional — the row "sub" line).
- `scheduledDate` (Date, optional — the day it sits on the timeline; null = unscheduled/backlog), `scheduledTime` (string `HH:MM`, optional).
- `done` (Boolean), `completedAt` (Date, optional).
- `effortMinutes` (Int, optional — feeds the Focus KPI).
- `tag` (string, optional — a label such as "Family"/"Piano" for tasks not tied to a project).
- `projectId` (ObjectId ref `Project`, optional), `column` (enum `backlog|this_week|doing|done`, optional — kanban position).
- `choreId` (ObjectId ref `Chore`, optional — set when the task is a chore occurrence).
- `order` (Int — ordering within a list/column).
- GraphQL `Task` type has a resolved `project` field. The Today timeline is `Task`s with `scheduledDate` == the requested day; a project board is `Task`s with a given `projectId` grouped by `column`.

### chores — `Chore`, `ChoreCompletion`
- `Chore`: `title`, `cadence: { type: daily|weekly|monthly, daysOfWeek: [Int], interval: Int, dayOfMonth: Int|null }`, `streak` (Int), `bestStreak` (Int), `lastCompletedOn` (Date), `active` (Boolean), `order` (Int).
- `ChoreCompletion`: `{ choreId, date }` — one row per completion; feeds the stats heatmap.
- A `choreService` materializes a chore's occurrence for a given day as a `Task` (with `choreId` set) when the chore is due; completing that Task updates `Chore.streak`/`lastCompletedOn` and writes a `ChoreCompletion`. The `today` query materializes the requested day's due chores.

### projects — `Project`
- `name`, `tag` (string), `status` (enum `on_track|hot|stalled|idle`), `blurb` (string), `nudge` (string, optional), `startedOn` (Date), `targetOn` (Date, optional), `order` (Int), `archived` (Boolean).
- Progress is **derived** (`done` Tasks / total Tasks for the project). The kanban board is the project's `Task`s grouped by `column`.

### calendar — `CalendarEvent`
- `title`, `date` (Date), `accent` (Boolean).

### journal — `JournalEntry`
- `date` (Date), `prompt` (string, optional), `pullQuote` (string), `body` (string), `tags` ([string]).

### inbox — `InboxItem`
- `text` (string), `source` (string — `quick-capture|voice|email|shortcut|calendar`), `triaged` (Boolean), `capturedAt` (Date).

### wren — `WrenConversation`, `WrenMessage`
- `WrenConversation`: one per user (`userId`).
- `WrenMessage`: `conversationId`, `sender` (enum `coach|user`), `text`, `actions` ([string], optional).
- Sub-project 2 builds the storage model and basic operations only; the coach's behavior is sub-project 5.

### review — `DailyReview`
- `date` (Date), `mood` (string), `responses` (JSON — per-step answers).

### stats — derived, no collection
- A `stats` query computes the activity heatmap (from `ChoreCompletion` + `Task` completion history) and ranked habits (from `Chore` streaks).

## Section 3 — GraphQL operations

The API exposes operations for every domain (so sub-projects 3–7 are UI-only). Highlights:

- **Today / KPIs:** `today(date: String): TodayView!` → `{ date, sunrise, sunset, kpis, tasks }`, where `kpis` is `{ streak, todayDone, todayTotal, focusMinutes, activeProjects }` and `tasks` is the day's `Task`s. `Task` mutations: `createTask`, `updateTask`, `completeTask`, `rescheduleTask`, `moveUnfinishedToTomorrow`, `deleteTask`.
- **chores:** `chores`, `createChore`, `updateChore`, `completeChore`, `deleteChore`.
- **projects:** `projects`, `project(id)`, `projectBoard(id)`, `createProject`, `updateProject`, plus project-task mutations (move between columns).
- **calendar / journal / inbox / review:** standard list + CRUD per domain.
- **wren:** `wrenMessages`, `sendWrenMessage` (stores a message; no AI reply yet).
- **stats:** `stats` → heatmap + ranked habits.
- **Subscriptions:** a `taskChanged(userId)` subscription is provided via `graphql-ws`; the Today screen does not need to subscribe (it refetches), but the infrastructure is in place.

`sunrise`/`sunset` are static seeded strings (no geolocation service — see Non-goals).

## Section 4 — The Today screen

Replaces the Foundation placeholder (`TodayView` on web, `app/(tabs)/index.tsx` on mobile), wired live to the `today` query.

**Web (desktop)** — in the 3-column shell's main column:
- `ScreenHeading` — "A quiet *full day.*" with right-aligned meta (sunrise / sunset).
- A 4-tile KPI strip — Streak, Today (done/total), Projects (active count), Focus (logged minutes).
- Three time-grouped sections — **Morning** / **Afternoon** / **Evening** — each a `SectionHeader` + a list of task rows, tasks split by `scheduledTime` hour (<12 / 12–17 / ≥17).
- An action row — "Add to today", "Plan with Wren", "Move unfinished to tomorrow".

**Mobile** — the `index` tab:
- Header (search button + avatar), date eyebrow, serif heading.
- A 3-tile KPI strip — Streak, Today, Focus.
- The accent Wren coach card — shows the latest seeded `WrenMessage`; tapping opens the Foundation's Wren sheet shell.
- A "Next" card — the next incomplete task, with quick actions.
- Three time-grouped task lists.

**New compound components** (built on Foundation primitives, one set per app): `KpiTile` + `KpiRow`, `TaskRow` (check + mono time + title + sub + tag pill), the Today coach card, and mobile's "Next" card. Tapping a task's check calls `completeTask`; the KPIs and grouping update from a refetch.

## Section 5 — Data-layer rework

The Foundation left the old Eisenhower Apollo operations and Pinia/Zustand stores in place but orphaned. This sub-project removes them and wires the Today slice.

- **Web** (`all-you-plan-web`): delete `src/api/operations/{tasks,spaces,briefings,nudges}.js` and `src/stores/{tasks,spaces,briefings,nudges}.store.js`. Add `src/api/operations/today.js` (the `today` query + task mutations) and `src/stores/today.store.js` (Pinia). The Apollo client config stays. `src/api/operations/auth.js` and `src/stores/auth.store.js` stay; adjust only for the `User.settings` shape change.
- **Mobile** (`all-you-plan-mobile`): the equivalent — delete the old operations/stores, add the `today` operations + a Zustand `today` store, keep auth.
- Sub-projects 3–7 add their own operations/stores against the already-built API.

## Section 6 — Seed data

A fresh `src/seeds/index.ts` wipes the database and creates a demo user `demo@allyouplan.com` / `Password1` (so the apps' demo login keeps working) with a realistic day, mirroring the design's sample data: ~8 Tasks for today across morning/afternoon/evening (some done, some linked to projects, some chore occurrences), ~6 Projects with their column-organized Tasks, ~14 Chores across daily/weekly/monthly cadences with streaks and `ChoreCompletion` history, a handful of CalendarEvents, JournalEntries, InboxItems, a WrenConversation with a few messages, and a populated `streak`. Run via `npm run seed`.

## Section 7 — Verification

- **API:** Vitest unit tests for auth (`requireAuth`, token logic), the chore-occurrence/recurrence service, the Today/KPI aggregation, and Zod validators — mocking Mongoose, as the current API does. Plus a manual `npm run seed` + `npm run dev` smoke check against a local MongoDB, confirming the GraphQL endpoint responds and the demo login works.
- **Web:** Vitest component tests for the new compound components (`TaskRow` completion, `KpiTile`); `npm run build`.
- **Mobile:** `npx tsc --noEmit`; `npm test`.
- **End-to-end:** with the API seeded and running, launch each app, sign in with the demo login, and confirm the Today screen renders the seeded day — KPIs, the three time groups, task completion updating the counts.

## Plan split

This sub-project is implemented as **three** plans, built in order (web and mobile depend on the API):

1. **API** (`2026-05-21-sp2-api.md`) — the clean-room rebuild: server bootstrap, auth, all nine domains plus the stats query (models, schemas, resolvers, services), seed data, tests.
2. **Web** (`2026-05-21-sp2-web.md`) — the Today screen, the new compound components, the data-layer rework.
3. **Mobile** (`2026-05-21-sp2-mobile.md`) — the Today screen, the new compound components, the data-layer rework.

## Risks

- **API surface built ahead of its screens.** Most of the API (chores, projects, journal, inbox, calendar, wren, review, stats resolvers) has no consuming screen until sub-projects 3–7. Mitigation: each domain ships with unit tests and seed data, so it is exercised and verifiable before its screen exists; the schema is reviewed against the design's `data.jsx` so later sub-projects do not need schema changes.
- **Clean-room auth re-implementation.** Re-writing auth risks a subtle regression. Mitigation: keep the exact GraphQL operation contract, port the proven two-token/`tokenVersion` approach, and unit-test it.
- **Chore-occurrence materialization.** Generating chore occurrences as Tasks for a given day has edge cases (duplicate prevention, timezone-day boundaries). Mitigation: the `today` query materializes idempotently (a chore has at most one occurrence Task per day, enforced by a `{choreId, scheduledDate}` guard).
- **Database target.** The current API's committed `.env` points at a shared MongoDB Atlas database. The rebuild seeds a fresh database; the implementer must point `.env` at a fresh local or Atlas database before seeding so existing data is not destroyed unexpectedly. Flagged in the API plan.
- **Scope.** This is the largest sub-project (a full API plus a screen ×2). It is split into three plans so each is independently reviewable and testable.
