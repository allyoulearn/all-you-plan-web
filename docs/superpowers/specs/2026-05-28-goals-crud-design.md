# Goals CRUD — design spec

## Problem

The Goals view (`src/views/GoalsView.vue`) is incomplete. Goals can only be created through three native `window.prompt` calls chained together, and there is no way to edit or remove an existing goal from the UI. The Pinia store (`src/stores/goals.store.js`) and the GraphQL operations (`src/api/operations/goals.js`) already expose full `create` / `update` / `archive` actions — the gap is purely in the view layer.

## Goals

- Replace the `window.prompt` create flow with a polished modal that fits the editorial design language of the rest of the screen.
- Add an edit modal reachable from every goal card (hero + grid).
- Add a remove action that archives the goal through the existing `archiveGoal` mutation, guarded by a confirm dialog.
- Mirror the conventions already established by the chores feature so reviewers see one consistent CRUD pattern across the app.

## Non-goals

- Manual editing of `status` (stays as the rolled-up `ok` / `risk` / `done` value the API returns).
- Managing linked projects or chores from inside the goal form. That is a separate, much larger feature.
- Archive-restore UI for already-removed goals.
- Wiring up the existing "Browse examples", "All statuses" filter, and "Year-end review" buttons on the action bar — they remain placeholders.
- Any change to the page layout, typography, or the existing hero + grid card visuals.

## Architecture

### New files

All under `src/components/goals/`:

- `GoalForm.vue` — shared field set used by both modals. Props: `modelValue` (form object), `submitted` (boolean). Emits `update:modelValue` and `valid` (boolean). Mirrors the contract of `ChoreForm`.
- `CreateGoalModal.vue` — wraps `GoalForm` in `AppModal` with create-flow chrome. Resets form on open. Calls `store.create` on save and closes on success.
- `EditGoalModal.vue` — same shell, but seeds the form from a `goal` prop and calls `store.update(goal.id, …)` on save.
- `GoalCardMenu.vue` — the `⋯` button + popover with Edit / Remove items. Stand-alone because goal cards differ structurally from chore rows, but the menu mechanics (outside-click close, escape close, right-aligned popover) match `ChoreRow.vue` exactly.

### Modified files

- `src/views/GoalsView.vue` — drops the `window.prompt` flow and the inline `openCreate` function. Owns three reactive bits: `showCreate`, `editingGoal`, `removingGoal`. Mounts the two modals plus one `AppConfirmDialog` at the bottom of the template. Adds `<GoalCardMenu>` to the hero card and to each grid card.
- `src/i18n/locales/en.json` — adds the new strings listed below. Removes the now-dead `goals.promptTitle`, `goals.promptWhy`, `goals.promptTargetDate` entries.
- `src/i18n/locales/de.json`, `es.json`, `fr.json`, `pt-BR.json` — mirror the English additions and deletions in the same shape so `vue-i18n` does not warn about missing keys.

### Unchanged

- The Pinia store (`src/stores/goals.store.js`) already exposes `load`, `create`, `update`, `archive` with toast error handling. No changes.
- The GraphQL operations (`src/api/operations/goals.js`) already declare `CREATE_GOAL`, `UPDATE_GOAL`, `ARCHIVE_GOAL` with the right input shapes. No changes.
- The mock fixtures (`src/mocks/fixtures/goals.js`) already implement all three mutations. No changes.
- The router (`src/router/index.js`) is untouched.

## The modal

The "intricate" feel comes from typography hierarchy and editorial copy, not extra fields or decorations. The modal should read like writing a journal entry, not filling out a form.

### Header

Replaces the default `AppModal` title slot with custom markup:

- Eyebrow line: mono caps, letter-spaced — `NEW GOAL` (create) or `EDIT GOAL` (edit).
- Serif title prompt directly under the eyebrow:
  - Create: *"What are you working toward?"*
  - Edit: *"Refine this goal."*

Matches the editorial voice used in the existing screen heading (`AppScreenHeading`) and the empty state.

### Body fields

Stacked vertically with generous spacing (`gap-5`):

1. **Title** — `AppTextField`, no visible label. Large 22px serif input. Placeholder doubles as the prompt: *"A short, vivid name…"*. Required.
2. **Why** — multi-line textarea, 18px italic serif so it visually matches how `why` already renders on the card (the existing `"…"` quotation styling). Placeholder: *"Why does this matter to you?"*. Required (at least one trimmed character).
3. **Target date** — mono caps eyebrow label `TARGET DATE` above a native `<input type="date">` styled to match the editorial line. Required, must parse as `YYYY-MM-DD`.

Note: the multiline "why" field uses a scoped `<textarea>` inside `GoalForm`, styled with the same border / focus-ring tokens as `AppTextField` but with editorial typography (`18px italic serif`). Extending `AppTextField` with a `multiline` prop was considered and rejected — it would widen the blast radius into a primitive used across the app for a one-off editorial treatment.

### Footer

- Ghost `Cancel` button (left).
- Primary save button (right):
  - Create: `Save goal`
  - Edit: `Save changes`
- Primary disabled until `valid === true`. While the mutation is in flight, the label flips to `Saving…` and both buttons disable.

### Width

Use `AppModal`'s default centered panel — the body's intrinsic content drives the width. No width override.

## Card actions

Every goal card (the hero card and every grid card) gets a `⋯` button in the top-right of its `__hero-top` row, appended after the existing `goals__mono` target-date span and separated by the existing `gap-3`.

The popover (right-aligned, `z-20`, same styling as `ChoreRow`'s `.menu-list`) holds two items:

- **Edit** — sets `editingGoal.value = goal` and opens `EditGoalModal`.
- **Remove** — sets `removingGoal.value = goal` and opens the confirm dialog.

Popover behavior matches `ChoreRow.vue` exactly:

- Click outside the trigger and the list closes the popover.
- `Escape` while open closes the popover (and stops propagation so it does not also close any open modal).
- Opening another card's menu closes the first via the outside-click listener.

## Remove confirmation

Uses the existing `AppConfirmDialog` primitive.

- Title: *Remove this goal?*
- Message: *"{title}" will be archived. Linked projects and chores stay where they are.*
- Confirm button label: *Remove*. `variant="primary"` — matches the chore delete confirm; the app does not use red destructive buttons.
- Cancel: ghost.
- While the mutation is in flight: `:busy="true"` so both buttons disable; `busyLabel="Removing…"`.

## Data flow

`GoalsView.vue` owns three new pieces of reactive state:

```js
const showCreate = ref(false)
const editingGoal = ref(null)   // a goal object, or null
const removingGoal = ref(null)  // a goal object, or null
const removing = ref(false)     // mutation in flight, used by AppConfirmDialog :busy
```

Closing a modal resets its corresponding ref to `false` / `null`. Saves go through the existing store actions, which already update `goals.value` locally on success, so the view re-renders without an extra `load()` round trip. The store wraps every mutation in `useErrorToast`, so failed saves are surfaced via toast and the modal stays open for retry.

## Edge cases

- **Validation** — Save disabled until `title.trim()` and `why.trim()` are non-empty and `targetDate` matches `^\d{4}-\d{2}-\d{2}$`. A `submitted` flag drives the `invalid` styling on the fields once the user clicks Save with empty data (mirrors `ChoreForm`).
- **Server errors** — Store toasts the error; modal sets `saving.value = false` and stays open so the user can retry.
- **Removing the hero goal** — `goals[0]` is the hero. After `archive`, `goals.value` shrinks; if it is now empty the view re-renders into the existing empty state automatically (the `v-if="!goals.length"` block already handles it). If exactly one goal remains, it becomes the new hero with no special handling.
- **Editing the hero goal** — Same flow as a grid card; the modal opens with the prepopulated form, the save mutates the store, and the hero re-renders.
- **Concurrent menus** — Only one popover open at a time. Each `GoalCardMenu` mounts its own outside-click listener; opening a second trigger fires the outside-click on the first and closes it.
- **Backdrop click while saving** — `AppModal` is invoked with `:close-on-backdrop="!saving"` so an accidental backdrop click cannot dismiss a mid-flight save (matches chore modals).
- **No optimistic UI** — Chores do not do it, so goals will not either. The brief saving state is acceptable.

## i18n strings

Add under `goals.*` in `en.json` (mirrored in `de`, `es`, `fr`, `pt-BR`):

```
"createEyebrow":     "NEW GOAL",
"editEyebrow":       "EDIT GOAL",
"createPrompt":      "What are you working toward?",
"editPrompt":        "Refine this goal.",
"titlePlaceholder":  "A short, vivid name…",
"whyLabel":          "Why",
"whyPlaceholder":    "Why does this matter to you?",
"targetDateLabel":   "Target date",
"saveCreate":        "Save goal",
"saveEdit":          "Save changes",
"saving":            "Saving…",
"actionsLabel":      "Goal actions",
"edit":              "Edit",
"remove":            "Remove",
"removeTitle":       "Remove this goal?",
"removeMessage":     "\"{title}\" will be archived. Linked projects and chores stay where they are.",
"removeConfirm":     "Remove",
"removing":          "Removing…"
```

Delete from all five locales (no longer used once the `window.prompt` flow is gone):

```
"promptTitle"
"promptWhy"
"promptTargetDate"
```

The translations for `de`, `es`, `fr`, and `pt-BR` are best-effort drafts done at implementation time so `vue-i18n` does not warn about missing keys. They do not need to be professionally translated as part of this change.

## Testing

Vitest, matching the patterns already in `tests/`:

- `tests/components/goals/GoalForm.spec.js` — emits `valid=false` when any required field is blank; emits `valid=true` once all three are populated; emits `update:modelValue` on each field change.
- `tests/components/goals/CreateGoalModal.spec.js` — calls `store.create` with trimmed fields on save; closes on success; surfaces a toast on store rejection (stubbed); resets form on reopen.
- `tests/components/goals/EditGoalModal.spec.js` — seeds the form from the `goal` prop; calls `store.update(goal.id, …)`; same close-on-success and toast-on-error semantics as create.
- `tests/views/GoalsView.spec.js` — if this file does not yet exist, add a small smoke test: kebab menu opens, Edit sets the editing goal, Remove opens the confirm dialog, confirm calls `store.archive`.

The store tests at `tests/stores/goals.store.test.js` already cover the underlying actions and need no change.

## Out of scope (reiterated)

- Manual status editing.
- Linked-project / linked-chore management.
- Archive-restore UI.
- The placeholder action-bar buttons (`Browse examples`, `All statuses`, `Year-end review`).
- Any change to page layout, typography, or hero / grid card visuals.
