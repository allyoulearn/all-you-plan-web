# Spec — No-reload task completion with completion animation

Date: 2026-05-24
Scope: `all-you-plan-web` (Vue 3 + Pinia + Apollo)

## Problem

In the projects surface (project detail view at `/projects/:id` and kanban view at `/projects/:id/board`), checking off a task triggers a full board refetch. The store's `completeTask()` awaits `loadBoard()`, which flips `loadingBoard = true` while the round-trip is in flight. Both views render `v-if="store.loadingBoard"` and swap their entire content for a "Loading…" status block during that window. The user experiences this as the whole page reloading every time they tick a task.

Two outcomes desired:

1. Tasks update instantly without the page flashing back to a loading state.
2. The completion is celebrated with a small, tactile animation that fits the calm paper/serif aesthetic of the app.

## Out of scope

- Apollo cache-driven reads (the codebase uses `fetchPolicy: 'network-only'` and Pinia as source of truth; switching to a cache-first model is a separate refactor).
- Uncompleting a task — there is no UI affordance for this today and we are not adding one.
- Periodic background refetch to catch concurrent edits — single-user app; not needed for v1.
- TodayView / KanbanView other than the projects surface. The today screen's completion flow uses a different store and is not part of this work.

## Architecture

Three files change, no new files:

- `src/stores/projects.store.js` — `completeTask()` becomes an optimistic local update plus a background mutation, with snapshot-based rollback on failure.
- `src/views/ProjectDetailView.vue` — wrap each section's task list in `<TransitionGroup name="task-complete">`.
- `src/views/KanbanView.vue` — wrap each column's `KanbanCard` loop in `<TransitionGroup name="task-complete">`.
- `src/components/ui/Checkbox.vue` — add a one-shot scale-pulse keyframe that fires when the checked state is applied. Self-contained, no prop changes.

## Store — optimistic `completeTask(id)`

Replace the current body of `completeTask` in `src/stores/projects.store.js:88`.

Algorithm:

1. Early-return if `board.value` is null (nothing to update).
2. Locate the task by id, scanning `thisWeek` → `doing` → `backlog` → `done`.
   - If found in `done`, no-op (idempotent — protects against double-clicks while mutation in flight).
   - If not found anywhere, no-op (stale id; nothing to do).
3. Capture a snapshot for rollback:
   - Shallow copies of `thisWeek`, `doing`, `backlog`, `done` arrays.
   - A shallow copy of `project.progress`.
4. Apply the optimistic update:
   - Splice the task out of its source column.
   - Push `{ ...task, done: true }` onto the front of `done` (deterministic landing spot at the top).
   - Update `project.progress.done += 1` and recompute `project.progress.percent = Math.round(done / total * 100)` (guard against `total === 0`).
5. Clear `errorBoard` and set `saving = true`.
6. Fire `apolloClient.mutate({ mutation: COMPLETE_PROJECT_TASK, variables: { id } })` (await it so errors are caught, but do NOT call `loadBoard()` on success).
7. On success: `saving = false`; done.
8. On error: restore the snapshot in-place (so reactive references update), set `errorBoard`, `toastError(e, 'Failed to complete task')`, rethrow, then `saving = false` in `finally`.

`loadingBoard` is never touched by `completeTask` — neither view will flip into the loading state during completion.

### Concurrency notes

- Two completions fired in quick succession: each runs its own snapshot-and-update; the in-memory state stays consistent because each update is synchronous before its mutation fires. The mutations themselves are independent on the server.
- A completion whose mutation is in flight while the user navigates away: the store still holds the snapshot until the promise settles. If the view remounts before settlement, `loadBoard()` from the new `onMounted` may overwrite our optimistic state with server truth — that's acceptable; both states should agree.

## Views — TransitionGroup wiring

### `ProjectDetailView.vue`

Replace the section-loop body so each section's task list becomes a transition group keyed by `task.id`:

```vue
<TransitionGroup
  name="task-complete"
  tag="div"
  class="project-detail-view__task-list"
>
  <div
    v-for="task in section.tasks"
    :key="task.id"
    class="project-detail-view__task-item"
  >
    <Checkbox … />
    <span …>{{ task.title }}</span>
    <Pill v-if="task.tag" …>{{ task.tag }}</Pill>
  </div>
</TransitionGroup>
```

The empty-state `<p>` block stays outside the TransitionGroup, gated by `v-if="!section.tasks.length"`.

### `KanbanView.vue`

Each column's `KanbanCard` v-for becomes:

```vue
<TransitionGroup name="task-complete" tag="div" class="kanban-view__column-tasks">
  <KanbanCard
    v-for="task in col.tasks"
    :key="task.id"
    :task="task"
    @complete="store.completeTask"
  />
</TransitionGroup>
```

A new `&__column-tasks { @apply flex flex-col gap-2; }` class wraps the cards so the existing gap behavior is preserved (today the column itself owns the gap; the wrapper takes it over).

The empty-state `<p>` again stays outside the TransitionGroup.

## Animations

All animation rules live behind `@media (prefers-reduced-motion: no-preference)`. Users with reduced motion get instant state changes (and still get the no-reload benefit).

### Vue transition classes (scoped to each view's stylesheet)

- `.task-complete-leave-active` — `transition: opacity 220ms ease-out, transform 220ms ease-out, max-height 220ms ease-out 80ms, margin 220ms ease-out 80ms, padding 220ms ease-out 80ms; overflow: hidden;`
- `.task-complete-leave-to` — `opacity: 0; transform: translateX(8px); max-height: 0; margin-top: 0; margin-bottom: 0; padding-top: 0; padding-bottom: 0;`
- `.task-complete-leave-from` — `max-height: 200px;` (a ceiling generous enough to fit a row in either view; visually identical because the real element height clamps it)
- `.task-complete-enter-active` — `transition: opacity 180ms ease-out 120ms, transform 180ms ease-out 120ms;`
- `.task-complete-enter-from` — `opacity: 0; transform: translateY(-4px);`
- `.task-complete-move` — `transition: transform 220ms cubic-bezier(0.4, 0, 0.2, 1);` (Vue's FLIP for neighbors gliding up)

The delays on enter (120ms) and leave's height-collapse (80ms) sequence the motion: fade leads, collapse follows, neighbors glide, new arrival fades in last.

### Checkbox pulse (`src/components/ui/Checkbox.vue`)

The pulse must fire only on the user-initiated false → true transition, not on initial mount for already-done tasks. Drive it with a transient `--just-checked` class managed by a watcher:

```js
// in setup()
const justChecked = ref(false)
let pulseTimer = null

watch(() => props.modelValue, (val, prev) => {
  if (val && !prev) {
    justChecked.value = true
    if (pulseTimer) clearTimeout(pulseTimer)
    pulseTimer = setTimeout(() => { justChecked.value = false }, 320)
  }
})

onBeforeUnmount(() => { if (pulseTimer) clearTimeout(pulseTimer) })
```

Template adds `'checkbox--just-checked': justChecked` to the class binding.

Add to the scoped stylesheet:

```scss
@media (prefers-reduced-motion: no-preference) {
  .checkbox--just-checked {
    animation: checkbox-pop 280ms ease-out;
  }

  .checkbox--just-checked .checkbox__icon {
    animation: checkbox-icon-pop 160ms ease-out;
  }

  @keyframes checkbox-pop {
    0%   { transform: scale(1); }
    35%  { transform: scale(1.18); }
    100% { transform: scale(1); }
  }

  @keyframes checkbox-icon-pop {
    0%   { transform: scale(0.6); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
}
```

Since the optimistic update sets `task.done = true` before the mutation, the user sees the pulse immediately on click — but a freshly mounted board with already-done tasks does not.

## Error handling

- Mutation failure: snapshot restores in place. The task reappears in its original column (the TransitionGroup runs the enter animation for the re-added node — visually, the task drifts back). `errorBoard` is set and `toastError` fires, matching existing patterns. The store rethrows for any caller that wants to react.
- Stale id (task not found in any column): silent no-op, no mutation fired. Should not happen in normal use but protects against race conditions where the board was refetched between render and click.

## Testing

Update `tests/stores/projects.store.test.js`:

- New: `completeTask updates local state without calling loadBoard` — assert source column shrank, `done` grew, `progress.done` incremented, `loadBoard` was not called, `loadingBoard` stayed false.
- New: `completeTask rolls back state on mutation failure` — assert columns and progress match the pre-call snapshot, `errorBoard` set, toast fired, rethrows.
- New: `completeTask is a no-op when task is already done` — assert no mutation fired, state unchanged.
- New: `completeTask is a no-op when board is null` — assert no mutation fired, no crash.
- New: `Checkbox does not pulse on initial mount when modelValue starts true` — render with `modelValue: true`, assert `checkbox--just-checked` class is absent.
- New: `Checkbox adds and clears the just-checked class on false → true transition` — toggle the prop, assert class added, then removed after the timer.
- Update any existing `completeTask` test that asserted a follow-up `loadBoard()` — it no longer should be called.

No component tests for the TransitionGroup wiring — view-render tests for animation transitions are brittle and rely on jsdom timing that's not faithful to a browser. The store-level tests cover the behavior; manual verification covers the animation.

## Manual verification

Run `npm run dev` and:

1. Open `/projects/:id` with a project that has tasks across multiple columns.
2. Check a task in This Week. Verify: checkbox pulses, row fades right and collapses, neighbors glide up, no "Loading…" flash, task appears at the top of Done.
3. Repeat in the kanban view at `/projects/:id/board`. Verify the same on a single column boundary.
4. With devtools throttling set to "Slow 3G" and the network panel watching, check a task. Verify the animation runs immediately, the mutation request is visible in the panel, and the UI never blanks.
5. Force the mutation to fail (e.g., return a network error from the mock server) and verify the row returns to its original column and the toast appears.
6. Toggle "Reduce motion" in OS settings and verify: no animations play, but the optimistic update still happens (no loading flash).

## Risks / open questions

- The optimistic update assumes the server always moves a completed task into the `done` column. If server-side rules ever change (e.g., a completed `doing` task stays in `doing` with a done flag), our optimistic state will diverge from the server until the next `loadBoard()`. Current server behavior matches our assumption; flag this if it changes.
- `progress.percent` is recomputed client-side as `Math.round(done / total * 100)`. If the server uses a different rounding rule, the displayed percentage could shift by 1% between optimistic and server-truth state. Acceptable.
