# All You Plan — Sub-project 4: Projects & Kanban — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Checkbox (`- [ ]`) steps.

**Goal:** Build the Projects list, Project detail, and Kanban board on web, and the Projects list + Project detail on mobile — wired live to the `projects` GraphQL API.

**Architecture:** Mirrors the SP2/SP3 pattern — Apollo operations + a `projects` store + compound components + the screens, on the Foundation primitives and the live API.

**API contract** (built — `2026-05-21-sp2-api.md` Task 6): `projects(includeArchived)` → `[Project { id name tag status blurb nudge startedOn targetOn order archived progress { done total percent } }]`; `project(id)` → `Project`; `projectBoard(id)` → `{ project, backlog: [Task!]!, thisWeek: [Task!]!, doing: [Task!]!, done: [Task!]! }`; mutations `createProject`, `updateProject`, `deleteProject`, and `updateTask(id, input)` (used to set a task's `column`). `Task` shape per `2026-05-21-sp2-api.md` Task 4. `completeTask(id)` completes a project task.

**Design reference:** the Claude Design bundle — desktop `screens.jsx` Projects list ("Six things you're *becoming.*", project cards with tag, progress bar, status), Project detail (back link, stat cards, blurb, four task sections This week / Doing / Backlog / Done, action row), Kanban (a 4-column board). Mobile `mobile.jsx` `MProjectsScreen` (an All/Hot/Stalled segmented control, project cards) and `MProjectDetailScreen` (mini-KPIs, a subtle coach card, four kanban-as-stacked-list sections).

UI-only. Both apps' project routes are Foundation placeholders. Work on `main`, one commit per task. Drag-to-move on the kanban is out of scope (the prototype's drag is visual-only) — boards display columns and support task completion.

---

## Part A — Web (`all-you-plan-web`)

### Task A1: Projects operations & store
**Files:** Create `src/api/operations/projects.js`, `src/stores/projects.store.js`; modify `src/api/operations/index.js`.
- [ ] Create `projects.js` with `gql` documents: `PROJECTS_QUERY` (the `projects` list with `progress`), `PROJECT_BOARD_QUERY` (`projectBoard(id)` with `project` and the four `Task` arrays — select `id title note tag done column order` on tasks), `UPDATE_TASK` (`updateTask(id, input)`), `COMPLETE_TASK` (reuse the same doc shape as `today.js`). Add `export * from './projects.js'` to `operations/index.js`.
- [ ] Create `projects.store.js` (Pinia setup store, mirroring `today.store.js`): `projects` ref, `board` ref, `loading`, `error`; `loadProjects()`, `loadBoard(id)`, `completeTask(id)` (mutate then `loadBoard` of the current board's project).
- [ ] Verify `npm run build`; commit `feat: projects operations and store`.

### Task A2: `ProjectCard` component
**Files:** Create `src/components/projects/ProjectCard.vue`, `ProjectCard.test.js`.
- [ ] `ProjectCard.vue` — props `{ project }`. A `Card` (Foundation primitive) containing: a row with a `Pill` for `project.tag` and a `Pill` for `project.status` (`accent` variant when status is `hot`); a serif `h3` name; a muted blurb; a `ProgressBar` (`:value="project.progress.percent / 100"`) with a mono `done/total` + percent caption; and, if `project.nudge`, an accent-colored nudge line with a `flag` `Icon`. The whole card is a `RouterLink` to `/projects/{id}`.
- [ ] `ProjectCard.test.js` — mount with a project; assert the name, tag, and percent render.
- [ ] `npm run test:unit -- ProjectCard` passes; commit `feat: ProjectCard component`.

### Task A3: Projects list screen
**Files:** Overwrite `src/views/ProjectsView.vue`.
- [ ] On mount `useProjectsStore().loadProjects()`. Render `ScreenHeading` (eyebrow "Workspaces · Projects", title "Six things you're", emphasis "becoming."), a button row ("New project" — `Button`, no handler), then a `SectionHeader` "Active" and a `grid grid-cols-2 gap-4` of `ProjectCard`s. Loading/error lines as in `TodayView.vue`.
- [ ] Verify `npm run build`; commit `feat: live Projects list`.

### Task A4: Project detail screen
**Files:** Overwrite `src/views/ProjectDetailView.vue`.
- [ ] Read the route `id`; on mount `store.loadBoard(id)`. Render: a mono "← Projects" `RouterLink`; `ScreenHeading` with the project name + tag; a `grid grid-cols-3 gap-4` of three `Card`s — **Progress** (serif `percent`% + a `ProgressBar`), **Done · open** (serif `{done} · {total - done}`), **Wren's read** (`accent` `Card`, the project `blurb` or `nudge` in serif italic — static for this sub-project); the project `blurb` as a serif-italic paragraph; then four `SectionHeader` + list blocks — **This week**, **Doing**, **Backlog**, **Done** — each listing its `board` column's tasks as rows (a `Checkbox` wired to `store.completeTask`, the task title, a `Pill` for the task `tag`). An action row of `Button`s ("Add task", "Switch to board view" → `RouterLink` to `/projects/{id}/board`, "Archive project" — no handler).
- [ ] Verify `npm run build`; commit `feat: live Project detail`.

### Task A5: Kanban board screen
**Files:** Overwrite `src/views/KanbanView.vue`; create `src/components/projects/KanbanCard.vue`.
- [ ] `KanbanCard.vue` — props `{ task }`, emits `complete`. A small `bg-paper` rounded card: the task title, a meta row with a `Pill` for the tag, and a `Checkbox` wired to emit `complete`.
- [ ] `KanbanView.vue` — read route `id`; `store.loadBoard(id)`; render `ScreenHeading` ("Memoir — *by status*" style — use the project name), then a `grid grid-cols-4 gap-3.5` of four columns (Backlog / This week / Doing / Done), each a `bg-paper-2` rounded column with a header (label + mono `[count]`) and its `KanbanCard`s wired `@complete="store.completeTask"`.
- [ ] Verify `npm run build`; commit `feat: live Kanban board`.

### Task A6: Web verification
- [ ] `npm run test:unit` (all pass) + `npm run build` (clean). Fix any failure, commit with `fix:`.

---

## Part B — Mobile (`all-you-plan-mobile`)

### Task B1: Projects operations & store
**Files:** Create `src/api/operations/projects.ts`, `src/stores/projects.store.ts`; modify the barrels.
- [ ] Create `projects.ts` — the same `gql` documents as web Task A1 (`PROJECTS_QUERY`, `PROJECT_BOARD_QUERY`, `COMPLETE_TASK`). Re-export from `operations/index.ts`.
- [ ] Create `projects.store.ts` — a Zustand store mirroring `today.store.ts`: a `Project` interface (`id name tag status blurb nudge startedOn targetOn order archived progress { done total percent }`) and a `ProjectBoard` interface; state `{ projects, board, loading, error, loadProjects, loadBoard, completeTask }`. Re-export from `stores/index.ts`.
- [ ] Verify `npx tsc --noEmit`; commit `feat: projects operations and store`.

### Task B2: `ProjectCard` component
**Files:** Create `src/components/projects/ProjectCard.tsx`.
- [ ] Props `{ project; onPress: () => void }`. A `Pressable` `paper2` rounded card (`useTheme()` + `StyleSheet`): a top row with a tag `Pill` and a status `Pill` (`accent` when `hot`); a serif project name; a muted blurb; a footer with a thin progress bar (`progress.percent`) and a serif-italic percentage; a meta line (`{done} done · {open} open`); and an optional accent nudge line with a `flag` `Icon`.
- [ ] Verify `npx tsc --noEmit`; commit `feat: ProjectCard component`.

### Task B3: Projects screen
**Files:** Overwrite `app/(tabs)/projects.tsx`.
- [ ] On mount `loadProjects()`. A `paper` `ScrollView` (safe-area top inset): header eyebrow + `ScreenHeading` ("Six things" / "you're becoming."); a `SegmentedControl` (`All` / `Hot` / `Stalled`) filtering by `status`; a list of `ProjectCard`s, each `onPress` → `router.push(\`/project/\${project.id}\`)`; 100-unit bottom spacer. Loading indicator.
- [ ] Verify `npx tsc --noEmit`; commit `feat: live Projects screen`.

### Task B4: Project detail screen
**Files:** Overwrite `app/(tabs)/project/[id].tsx`.
- [ ] Read `id` via `useLocalSearchParams`; on mount `loadBoard(id)`. A `paper` `ScrollView`: a back row (chevron-left `IconButton` → `router.back()`) + the project name as `ScreenHeading`; a 2-up mini-KPI row (Progress `percent`% with a bar; "Done / open" `{done}/{open}`); a `subtle` coach card (`paper`-bg, "Wren noticed" eyebrow + the project `nudge`/`blurb` in serif italic — static this sub-project); then four stacked sections — This week / Doing / Backlog / Done — each a `SectionHeader` + a list of task rows (`Checkbox` wired to `completeTask`, title, tag `Pill`). 110-unit bottom spacer.
- [ ] Verify `npx tsc --noEmit`; commit `feat: live Project detail`.

### Task B5: Mobile verification
- [ ] `npx tsc --noEmit` (clean) + `npm test` (palette suite passes). Fix any failure, commit with `fix:`.

---

## Notes
- Reuse the SP2/SP3 store + component patterns exactly (fetch policy `network-only`, the loading/error shape, `useTheme()` styling).
- `createProject`/`updateProject`/`deleteProject` and "Add task" exist in the API but have no UI here — the buttons render without handlers.
- "Wren's read" / the subtle coach card show the project's own `blurb`/`nudge` text statically; live Wren commentary is sub-project 5.
