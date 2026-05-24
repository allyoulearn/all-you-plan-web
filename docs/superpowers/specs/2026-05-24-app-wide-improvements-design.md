# App-wide improvements (10 features) — Design

**Date:** 2026-05-24
**Scope:** all-you-plan-web (Vue 3 + Apollo) and all-you-plan-api (Apollo Server 4 + MongoDB).
**Out of scope:** all-you-plan-mobile (React Native, separate stack).

## Why

The board today is rigid (four hardcoded columns, checkbox-only completion, no drag). Tasks are flat (no priority, no subtasks, can only be edited at create time). Several views (Inbox, Calendar, Archived projects, Chores) lack the workflow actions users actually need. This pass adds ten focused improvements that, taken together, turn the app from "todo capture" into actual project execution.

## Cross-cutting decisions

- **Drag-and-drop library:** `vuedraggable@next` (SortableJS wrapper for Vue 3). ~25 KB gzipped, handles nested drag groups, reorder animations, touch, drag handles, ghost previews. Used in F1, F5, F6.
- **Optimistic store pattern:** identical to existing `completeTask` — snapshot board, replace atomically, rollback on error, toast via `useErrorToast`. Apollo cache objects are frozen; never mutate, always replace.
- **Modal pattern:** existing `Modal.vue` (focus-trap, scroll-lock, ESC, restore-focus). New form modals follow `CreateTaskModal.vue` structure.
- **i18n:** every user-facing string goes through `useI18n()`. New keys land under feature-scoped namespaces (`kanban.*`, `tasks.*`, `chores.*`, `journal.*`, `inbox.*`, `projects.*`).
- **Dark mode:** every new color / bg / border ships with `dark:` variant per family rule.
- **Heroicons only** for icons.
- **No emoji** in code / commits / output.

## Verification per feature

For every feature:
1. `npm run lint` (web) and `npm run lint` (api) must pass.
2. `npm run test:run` (web) and equivalent on api must pass with new tests added.
3. Dev server smoke (where the feature has UI): start `npm run dev`, exercise the feature happy path + one error path.
4. Commit as a single feat commit referencing the spec.

End-to-end "everything works fine" still requires a human pass through the UI. Automated checks catch regressions, not subjective UX issues.

---

## F1 — Kanban: custom columns + drag-and-drop

**Goal:** per-project, fully editable columns. Drag tasks between columns, reorder within a column, reorder columns themselves. Completion remains independent (checkbox on card).

### Data model
- New `Column` Mongoose model:
  ```
  Column { _id, userId, projectId, label, order, createdAt, updatedAt }
  indexes: { userId: 1, projectId: 1, order: 1 }
  ```
- `Task.column` (enum) → `Task.columnId` (ObjectId, ref Column, required when projectId set).

### API additions
```graphql
type Column { id: ID!, projectId: ID!, label: String!, order: Int!, createdAt: String!, updatedAt: String! }
type ColumnTasks { columnId: ID!, tasks: [Task!]! }

type ProjectBoard {
  project: Project!
  columns: [Column!]!
  tasksByColumn: [ColumnTasks!]!  # parallel array, same order as columns
}

enum DeleteColumnMode { move delete }

extend type Mutation {
  createColumn(projectId: ID!, label: String!): Column!
  updateColumn(id: ID!, label: String): Column!
  reorderColumns(projectId: ID!, columnIds: [ID!]!): [Column!]!
  deleteColumn(id: ID!, mode: DeleteColumnMode!, moveToColumnId: ID): Boolean!
  moveTask(id: ID!, columnId: ID!, order: Int!): Task!
  reorderTasksInColumn(columnId: ID!, taskIds: [ID!]!): [Task!]!
}
```
Drop `UpdateTaskInput.column` (enum) — moves go through `moveTask` / `reorderTasksInColumn` only.

### Frontend
- `projects.store.js`: `board.columns` (ordered) + `board.tasksByColumn` (Map<columnId, Task[]>); new actions `moveTask`, `reorderTasksInColumn`, `reorderColumns`, `createColumn`, `renameColumn`, `deleteColumn`. Optimistic + rollback.
- `KanbanView.vue`: outer `<draggable>` on columns (handle: column header), inner `<draggable>` on tasks (group: `kanban-tasks`). `+ Add column` chip at the end.
- New components: `ColumnHeaderMenu.vue` (rename/delete actions), `RenameColumnModal.vue`, `DeleteColumnDialog.vue` (move-or-delete mode), inline add-column input.
- `ProjectDetailView.vue` keeps section view; iterates over dynamic `board.columns` in order instead of the hardcoded 4 sections.

### Migration
One-shot Mongoose script `scripts/migrate-columns.ts`:
1. For each project, create 4 `Column` records (Backlog, This Week, Doing, Done) in that order.
2. For each task with a `column` enum value, set `columnId` to the matching new column id (per project).
3. Drop `Task.column` field after backfill verifies.

Idempotent — re-running is a no-op when columns already exist.

---

## F2 — Task detail / edit modal

**Goal:** click any task anywhere (Today, Project, Kanban card, Inbox-derived task) to open a modal showing all task fields, editable inline. Currently tasks are only editable at create time.

### Data model
No changes — Task already has all the relevant fields.

### API
Already exposes `UPDATE_TASK` mutation. Extend `UpdateTaskInput` to allow all editable fields (it largely does; add `priority` from F3, `subtasks` from F4).

Add:
```graphql
extend type Query { task(id: ID!): Task!  # already exists }
```

### Frontend
- New component `TaskDetailModal.vue` in `components/tasks/`. Props: `taskId`. Loads via `task(id)` query if not already in local state; otherwise reads from a passed-in object.
- Fields: title, note (textarea), tag, scheduledDate (date input), scheduledTime (time input), effortMinutes (number), projectId (select), columnId (select — only when projectId set), priority (F3), subtasks (F4).
- Footer: Save, Delete, Cancel. Delete uses ConfirmDialog.
- Triggered from:
  - `KanbanCard` click (not on the checkbox)
  - `TaskRow` (Today view) click on title
  - `ProjectDetailView` task row click on title
  - F7 inbox-converted task surfaces
- New store `tasks.store.js` (or extend each existing store). Action: `updateTask(id, input)` — optimistic where possible; `loadBoard` / `loadToday` refetch on success of complex updates that change which view a task belongs to (project change, date change).

---

## F3 — Task priority

**Goal:** four-level priority with a colored dot rendered on every task card.

### Data model
- `Task.priority: 'urgent' | 'high' | 'normal' | 'low'`, default `'normal'`.
- Add to GraphQL `Task` type, `CreateTaskInput`, `UpdateTaskInput`.

### Frontend
- New primitive `PriorityDot.vue` (size, value) — 8px filled circle, color map:
  - urgent: bg-bad
  - high: bg-warn
  - normal: bg-muted
  - low: opacity-40 muted
- Renders on `KanbanCard`, `TaskRow` (left of title).
- `TaskDetailModal` shows a `SegmentedControl` for priority.
- `CreateTaskModal` and `CreateProjectTaskModal` add a priority segmented control (defaults to normal).
- Kanban store: optional client-side priority sort within each column (toggle in column menu — out of v1; just persist priority and render dot).

---

## F4 — Subtasks (checklist)

**Goal:** a task can have sub-items the user checks off. Card shows "N/M" badge.

### Data model
- `Task.subtasks: [{ _id, text, done }]` embedded subdocs.
- GraphQL `type Subtask { id: ID!, text: String!, done: Boolean! }` and `Task.subtasks: [Subtask!]!`.

### API
```graphql
extend type Mutation {
  addSubtask(taskId: ID!, text: String!): Task!
  updateSubtask(taskId: ID!, subtaskId: ID!, text: String, done: Boolean): Task!
  deleteSubtask(taskId: ID!, subtaskId: ID!): Task!
  reorderSubtasks(taskId: ID!, subtaskIds: [ID!]!): Task!
}
```

### Frontend
- `TaskDetailModal` shows the subtask list under the note field: inline Checkbox + editable text + delete icon per row, "+ Add step" at the bottom.
- `KanbanCard` badge: `2/5` if any subtasks, else hidden. Same on `TaskRow`.
- Card progress doesn't affect task.done (which is its own flag). Useful for nudging completion but doesn't auto-complete the task.

---

## F5 — Calendar drag-to-reschedule

**Goal:** in CalendarView, drag a task card from one day cell to another to update its `scheduledDate`.

### Data model / API
No model change. Use existing `rescheduleTask(id, scheduledDate, scheduledTime)`.

### Frontend
- `CalendarView.vue` day cells become drop targets via `vuedraggable` with `group: "calendar-tasks"`.
- Drop on a different day fires `rescheduleTask` (optimistic move locally first, rollback on error).
- The dragged card retains its `scheduledTime` unless dropped on the explicit "unscheduled" tray (rare; punt to v1.1 if not trivial).

---

## F6 — Today: time-of-day grouping

**Goal:** group today's tasks into three lanes — Morning / Afternoon / Evening — based on `scheduledTime`. Drag a card between lanes to set its scheduledTime to the lane's default.

### Data model / API
No model change. Lanes are derived client-side:
- Morning: `< 12:00` (or unset, optionally)
- Afternoon: `12:00–17:59`
- Evening: `>= 18:00`
- Unscheduled (no time): own lane at the top — "Anytime today"

Drop into a lane sets `scheduledTime` to its band default (Morning=09:00, Afternoon=13:00, Evening=18:00). Dropping into "Anytime" clears scheduledTime.

### Frontend
- `TodayView.vue`: replace flat task list with four lanes (`vuedraggable`, `group: "today-time"`).
- Within a lane tasks sort by `scheduledTime` then `order`.
- Add a "time-of-day" toggle in the view header (default on) — collapses back to flat list when off.

---

## F7 — Inbox: bulk select + bulk actions

**Goal:** triage multiple inbox items at once.

### API
```graphql
extend type Mutation {
  triageInboxItemsBulk(ids: [ID!]!): [InboxItem!]!
  deleteInboxItemsBulk(ids: [ID!]!): Int!  # number deleted
  convertInboxItemsToTasks(ids: [ID!]!, projectId: ID, scheduledDate: String): [Task!]!
}
```
Adds a server-side bulk path so we don't loop on the client.

### Frontend
- `InboxView.vue`: each item gets a leading Checkbox; header shows a bulk actions bar when ≥1 selected: "Send to project ▼", "Schedule today", "Delete", "Triage", "Clear selection".
- "Send to project" opens a small popover with project picker — calls `convertInboxItemsToTasks` with that projectId, then triages.
- "Schedule today" calls `convertInboxItemsToTasks` with today's date.

---

## F8 — Archived projects view + restore

**Goal:** see archived projects and bring them back.

### API
`PROJECTS_QUERY` already supports `includeArchived: Boolean`. Add no new mutation — restore is just `updateProject(id, archived: false)`.

### Frontend
- `ProjectsView.vue` adds a SegmentedControl: Active | Archived (default Active). Switching loads with `includeArchived` accordingly and filters client-side.
- Archived project card shows a "Restore" button instead of the normal actions, calls `updateProject(id, { archived: false })`, refreshes list.

---

## F9 — Chore snooze + skip-next

**Goal:** pause a recurring chore for N days, or skip just the next occurrence.

### Data model
- `Chore.snoozedUntil?: Date` — chore is hidden from "today" materialization while `snoozedUntil > now`.
- `Chore.skipNextDate?: Date` — when chore is materialized for `date === skipNextDate`, skip it once and clear the field.

### API
```graphql
extend type Chore { snoozedUntil: String, skipNextDate: String }
extend type Mutation {
  snoozeChore(id: ID!, until: String!): Chore!  # ISO date or datetime
  skipNextChore(id: ID!): Chore!                # marks next due date as skipped
  resumeChore(id: ID!): Chore!                  # clears snoozedUntil
}
```

Service `materializeChoreOccurrences`: filter out chores where `snoozedUntil > now`; when occurrence date matches `skipNextDate`, skip and clear.

### Frontend
- `ChoreRow` adds an overflow menu: Snooze 1d / 3d / 7d / Until..., Skip next, Resume (when snoozed), Edit, Delete.
- Snoozed chores show a muted "Snoozed until <date>" badge.

---

## F10 — Journal tags + tag filter

**Goal:** filter the journal list by tag. (Model already supports `tags: [String!]!`.)

### API
No new mutations. Add an optional `tag` filter to the query:
```graphql
extend type Query {
  journalEntries(limit: Int, before: String, tag: String): [JournalEntry!]!
}
```

### Frontend
- `JournalView.vue`: pill row at the top of the list — "All" + one pill per known tag (derived from loaded entries; populated client-side for v1, server-side aggregation can come later).
- Selecting a pill filters the list (refetch with `tag` arg).
- Compose form already accepts tags; expose the tag input clearly (chips with comma/Enter to add).

---

## File-level plan summary

### API changes (per feature, files touched)
- F1: `domains/columns/{schema.graphql,model.ts,resolvers.ts,service.ts}` (new), `domains/projects/{schema.graphql,resolvers.ts,service.ts}` (board returns dynamic columns), `domains/tasks/{schema.graphql,model.ts,resolvers.ts,service.ts}` (`columnId`, new move mutations), `scripts/migrate-columns.ts` (new), tests.
- F2: extends existing `tasks/resolvers.ts` only.
- F3: `domains/tasks/{schema.graphql,model.ts,resolvers.ts}`.
- F4: `domains/tasks/{schema.graphql,model.ts,resolvers.ts,service.ts}`.
- F5: no API changes.
- F6: no API changes.
- F7: `domains/inbox/{schema.graphql,resolvers.ts,service.ts}`.
- F8: no API changes.
- F9: `domains/chores/{schema.graphql,model.ts,resolvers.ts,service.ts}`.
- F10: `domains/journal/{schema.graphql,resolvers.ts}`.

### Web changes (per feature)
- F1: new `KanbanView` rewrite, new column components, store changes, `vuedraggable` install.
- F2: new `TaskDetailModal`, hooks into KanbanCard / TaskRow / project rows.
- F3: new `PriorityDot`, additions to existing card / row / create modals.
- F4: subtask list inside TaskDetailModal, badge on cards.
- F5: CalendarView drop targets.
- F6: TodayView lane layout + drag.
- F7: InboxView bulk bar.
- F8: ProjectsView segmented control + restore action.
- F9: ChoreRow overflow menu, snooze badge.
- F10: JournalView pill row + filter wiring.

### Dependencies (build order)
F1 → F2 → (F3, F4 in either order, both depend on F2) → F5 → F6 → F7 → F8 → F9 → F10.

## Risks & mitigations
- **Column migration** is destructive on schema (drops enum). Mitigation: backfill leaves enum field intact, ship a follow-up that drops it after a release where nothing reads it.
- **vuedraggable + TransitionGroup** conflicts: keep the existing complete-animation; accept that drag uses vuedraggable's own move animation. Verified to not duplicate animation paths.
- **Optimistic moves at scale**: each drag is one mutation. Coalescing not needed for personal-scale data.
- **GraphQL breaking changes**: bumping `ProjectBoard` shape from named arrays to `columns/tasksByColumn` breaks the mobile app if it consumes this. Mitigation: this spec excludes mobile; if mobile needs the old shape, expose a deprecated `legacyBoard` field. Defer until requested.
- **End-to-end UI confidence**: requires human verification. Spec verification stops at lint + unit tests + smoke dev-server checks.
