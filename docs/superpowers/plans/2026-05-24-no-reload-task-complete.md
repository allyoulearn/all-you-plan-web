# No-reload Task Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the projects surface from flashing back to a "Loading…" state every time the user checks off a task. Replace the post-mutation refetch with an optimistic local update, then layer in a tactile fade-and-collapse animation and a checkbox pulse so completion feels rewarding.

**Architecture:** `projects.store.completeTask()` updates the four task columns and `progress` in place before firing the GraphQL mutation in the background, with snapshot-based rollback on failure. The `loadingBoard` flag is no longer touched by completion, so the two consuming views (`ProjectDetailView`, `KanbanView`) never blank out. Both views wrap their task lists in a `<TransitionGroup>` keyed by `task.id`; scoped SCSS drives a fade + collapse leave and a fade-in enter. `Checkbox.vue` runs a one-shot CSS keyframe pulse on the false → true transition, gated by a transient class so already-done tasks don't pulse on initial mount. Every animation lives behind `prefers-reduced-motion: no-preference`.

**Tech Stack:** Vue 3.5, Pinia 3, Apollo Client 3, Tailwind 3.4, Vitest 4, vue-i18n 11.

**Spec:** `docs/superpowers/specs/2026-05-24-no-reload-task-complete-design.md`

**Before you start:** Run all work in this `all-you-plan-web` directory. Husky runs `lint-staged` (eslint + prettier) on commit, so each commit must lint-pass. Don't touch the unrelated `package-lock.json` or `src/views/JournalView.vue` modifications already in the working tree at the time of writing — those belong to other work. Tests run via `npm run test:run` (single pass) or `npm test` (watch).

**Conventions:** JavaScript (no TypeScript). Import alias `@/` maps to `src/`. Commits follow Conventional Commits matching the repo history (`feat`, `fix`, `test`, `refactor`, `docs`). The family `CLAUDE.md` forbids emoji in code, comments, and commit messages.

---

## File Structure

Files modified by this plan:

- `src/stores/projects.store.js` — rewrite `completeTask()` (optimistic update + rollback).
- `src/components/ui/Checkbox.vue` — add `justChecked` watcher + transient `--just-checked` class + keyframe CSS.
- `src/views/ProjectDetailView.vue` — wrap each section's task list in `<TransitionGroup>`; add `task-complete-*` scoped SCSS.
- `src/views/KanbanView.vue` — wrap each column's `KanbanCard` loop in `<TransitionGroup>`; add a `column-tasks` wrapper class; add `task-complete-*` scoped SCSS.
- `tests/stores/projects.store.test.js` — rewrite `completeTask` tests for the new behavior.
- `tests/components/ui/Checkbox.test.js` — add tests for the pulse class behavior.

No new files are created.

---

### Task 1: Rewrite `completeTask` store tests (red)

**Files:**
- Modify: `tests/stores/projects.store.test.js`

The current `fakeBoard` fixture uses a `columns` array shape that does not match what `completeTask` will read (`thisWeek`/`doing`/`backlog`/`done` arrays plus `project.progress`). The whole `completeTask()` describe-block is replaced with the new behavior.

- [ ] **Step 1: Add a board fixture matching the real shape**

Open `tests/stores/projects.store.test.js`. Below the existing `fakeBoard` constant (around line 34), add a new fixture that matches the real `PROJECT_BOARD_QUERY` shape:

```js
function makeOptimisticBoard() {
  return {
    project: {
      id: 'p1',
      title: 'Alpha',
      status: 'on_track',
      progress: { done: 1, total: 4, percent: 25 }
    },
    thisWeek: [{ id: 't1', title: 'Task A', done: false, tag: null }],
    doing: [{ id: 't2', title: 'Task B', done: false, tag: null }],
    backlog: [{ id: 't3', title: 'Task C', done: false, tag: null }],
    done: [{ id: 't4', title: 'Task D', done: true, tag: null }]
  }
}
```

Leave the existing `fakeBoard` alone — other tests still use it.

- [ ] **Step 2: Replace the entire `describe('completeTask()')` block**

Find the block starting at `describe('completeTask()', () => {` (around line 240). Replace its full body — opening through closing brace — with:

```js
  describe('completeTask()', () => {
    it('moves the task to done locally without calling loadBoard (no reload flash)', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      await store.completeTask('t1')

      // Mutation fired with the task id
      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: 't1' } })
      )
      // No board refetch
      expect(apolloClient.query).not.toHaveBeenCalled()
      // Task moved from thisWeek to done (front of done)
      expect(store.board.thisWeek.find(t => t.id === 't1')).toBeUndefined()
      expect(store.board.done[0]).toMatchObject({ id: 't1', done: true })
      // Progress updated
      expect(store.board.project.progress.done).toBe(2)
      expect(store.board.project.progress.percent).toBe(50)
      // loadingBoard stayed false
      expect(store.loadingBoard).toBe(false)
    })

    it('moves a task from doing to done', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      await store.completeTask('t2')

      expect(store.board.doing.find(t => t.id === 't2')).toBeUndefined()
      expect(store.board.done[0]).toMatchObject({ id: 't2', done: true })
    })

    it('moves a task from backlog to done', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      await store.completeTask('t3')

      expect(store.board.backlog.find(t => t.id === 't3')).toBeUndefined()
      expect(store.board.done[0]).toMatchObject({ id: 't3', done: true })
    })

    it('is a no-op when the task is already done (idempotent)', async () => {
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()
      const beforeDone = [...store.board.done]

      await store.completeTask('t4')

      expect(apolloClient.mutate).not.toHaveBeenCalled()
      expect(store.board.done).toEqual(beforeDone)
      expect(store.board.project.progress.done).toBe(1)
    })

    it('is a no-op when the task id is not found', async () => {
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      await store.completeTask('nope')

      expect(apolloClient.mutate).not.toHaveBeenCalled()
    })

    it('is a no-op when board is null', async () => {
      const store = useProjectsStore()
      store.board = null

      await store.completeTask('t1').catch(() => {})

      expect(apolloClient.mutate).not.toHaveBeenCalled()
      expect(apolloClient.query).not.toHaveBeenCalled()
    })

    it('rolls back state and surfaces error on mutation failure', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('complete failed'))
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()
      const originalThisWeek = [...store.board.thisWeek]
      const originalDone = [...store.board.done]
      const originalProgress = { ...store.board.project.progress }

      await store.completeTask('t1').catch(() => {})

      // State restored
      expect(store.board.thisWeek).toEqual(originalThisWeek)
      expect(store.board.done).toEqual(originalDone)
      expect(store.board.project.progress).toEqual(originalProgress)
      // Error surfaced
      expect(store.errorBoard).toBe('complete failed')
      expect(mockToastError).toHaveBeenCalledWith(expect.any(Error), 'Failed to complete task')
    })

    it('re-throws the error on mutation failure (WEB-W1-01)', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('complete failed'))
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()
      await expect(store.completeTask('t1')).rejects.toThrow('complete failed')
    })

    it('clears a stale errorBoard before running (WEB-W1-05)', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()
      store.errorBoard = 'stale error'

      await store.completeTask('t1')

      expect(store.errorBoard).toBe('')
    })

    it('toggles saving true → false (WEB-W1-11)', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      const promise = store.completeTask('t1')
      expect(store.saving).toBe(true)
      await promise
      expect(store.saving).toBe(false)
    })

    it('resets saving on failure (WEB-W1-11)', async () => {
      apolloClient.mutate.mockRejectedValueOnce(new Error('complete failed'))
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      await store.completeTask('t1').catch(() => {})
      expect(store.saving).toBe(false)
    })

    it('never sets loadingBoard during completion', async () => {
      apolloClient.mutate.mockResolvedValueOnce({})
      const store = useProjectsStore()
      store.board = makeOptimisticBoard()

      const promise = store.completeTask('t1')
      expect(store.loadingBoard).toBe(false)
      await promise
      expect(store.loadingBoard).toBe(false)
    })
  })
```

- [ ] **Step 3: Run the tests and verify they fail**

Run: `npm run test:run -- tests/stores/projects.store.test.js`

Expected: most of the new `completeTask` tests FAIL because the current implementation still calls `loadBoard()` (so `apolloClient.query` IS called) and does not mutate local state. The idempotent / null-board / no-op tests may pass for the wrong reasons — that's fine; the next task will make them pass for the right reason.

- [ ] **Step 4: Do NOT commit yet**

The store implementation in Task 2 lands together with these tests so the working tree never holds a broken state. Commit happens at the end of Task 2.

---

### Task 2: Implement optimistic `completeTask` in the store (green)

**Files:**
- Modify: `src/stores/projects.store.js`

- [ ] **Step 1: Rewrite `completeTask`**

Open `src/stores/projects.store.js`. Find the existing `async function completeTask(id)` (line 88) and replace the whole function and its preceding doc comment with:

```js
  /**
   * Mark a project task as complete with an optimistic local update.
   *
   * Moves the task from its source column (`thisWeek` | `doing` | `backlog`)
   * to the front of `done`, recomputes `project.progress`, and fires the
   * mutation in the background — so the views never flip to a loading state
   * during completion. On failure, the captured snapshot is restored, the
   * error is surfaced via `errorBoard` + toast (WEB-W1-05 / WEB-W1-13), and
   * rethrown for callers (WEB-W1-01).
   *
   * No-ops when `board` is null, when the task id is not found in any column,
   * or when the task is already in `done` (idempotent — protects against
   * double-clicks while the mutation is in flight).
   * @param {string} id - The task ID to complete
   * @throws Re-throws the API error after surfacing it via errorBoard + toast.
   */
  async function completeTask(id) {
    if (!board.value) return

    const SOURCE_COLUMNS = ['thisWeek', 'doing', 'backlog']
    let sourceCol = null
    let task = null
    for (const col of SOURCE_COLUMNS) {
      const found = board.value[col]?.find(t => t.id === id)
      if (found) {
        sourceCol = col
        task = found
        break
      }
    }
    // Already done, or not on this board at all — no-op.
    if (!task) {
      const inDone = board.value.done?.some(t => t.id === id)
      if (inDone) return
      return
    }

    const { toastError } = useErrorToast()
    const snapshot = {
      thisWeek: [...(board.value.thisWeek ?? [])],
      doing: [...(board.value.doing ?? [])],
      backlog: [...(board.value.backlog ?? [])],
      done: [...(board.value.done ?? [])],
      progress: board.value.project?.progress ? { ...board.value.project.progress } : null
    }

    board.value[sourceCol] = board.value[sourceCol].filter(t => t.id !== id)
    board.value.done = [{ ...task, done: true }, ...(board.value.done ?? [])]
    if (board.value.project?.progress) {
      const total = board.value.project.progress.total ?? 0
      const done = (board.value.project.progress.done ?? 0) + 1
      board.value.project.progress = {
        ...board.value.project.progress,
        done,
        percent: total > 0 ? Math.round((done / total) * 100) : 0
      }
    }

    errorBoard.value = ''
    saving.value = true
    try {
      await apolloClient.mutate({ mutation: COMPLETE_PROJECT_TASK, variables: { id } })
    } catch (e) {
      board.value.thisWeek = snapshot.thisWeek
      board.value.doing = snapshot.doing
      board.value.backlog = snapshot.backlog
      board.value.done = snapshot.done
      if (snapshot.progress && board.value.project) {
        board.value.project.progress = snapshot.progress
      }
      errorBoard.value = e.message
      toastError(e, 'Failed to complete task')
      throw e
    } finally {
      saving.value = false
    }
  }
```

- [ ] **Step 2: Run the store tests and verify they pass**

Run: `npm run test:run -- tests/stores/projects.store.test.js`

Expected: PASS — all 11 tests in the `completeTask()` describe block pass, plus the rest of the file remains green.

- [ ] **Step 3: Run the full test suite to catch downstream breakage**

Run: `npm run test:run`

Expected: PASS — the change is isolated to `completeTask`; no other test should regress. If any view-level test fails because it asserted a refetch happened, update that test to match the new behavior (likely candidate: `tests/views/ProjectDetailView.test.js`).

- [ ] **Step 4: Commit**

```bash
git add src/stores/projects.store.js tests/stores/projects.store.test.js
git commit -m "$(cat <<'EOF'
feat(projects): optimistic task completion (no board refetch)

completeTask moves the task locally and fires the mutation in the
background, with snapshot rollback on failure. loadingBoard is no
longer toggled by completion, so ProjectDetailView and KanbanView
no longer flash to a loading state when a task is checked.
EOF
)"
```

---

### Task 3: Checkbox pulse animation (TDD)

**Files:**
- Modify: `src/components/ui/Checkbox.vue`
- Modify: `tests/components/ui/Checkbox.test.js`

- [ ] **Step 1: Add failing tests for the just-checked class**

Open `tests/components/ui/Checkbox.test.js`. Inside the `describe('Checkbox', () => {` block, add these tests just before the closing `})` of that describe (so they appear before the `describe('ProgressBar', …)` block):

```js
  it('does not add the just-checked class on initial mount when modelValue starts true', () => {
    const wrapper = mount(Checkbox, { props: { modelValue: true } })
    expect(wrapper.classes()).not.toContain('checkbox--just-checked')
  })

  it('adds the just-checked class on false → true transition', async () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false } })
    await wrapper.setProps({ modelValue: true })
    expect(wrapper.classes()).toContain('checkbox--just-checked')
  })

  it('does not add the just-checked class on true → false transition', async () => {
    const wrapper = mount(Checkbox, { props: { modelValue: true } })
    await wrapper.setProps({ modelValue: false })
    expect(wrapper.classes()).not.toContain('checkbox--just-checked')
  })

  it('clears the just-checked class after the pulse duration', async () => {
    vi.useFakeTimers()
    try {
      const wrapper = mount(Checkbox, { props: { modelValue: false } })
      await wrapper.setProps({ modelValue: true })
      expect(wrapper.classes()).toContain('checkbox--just-checked')

      vi.advanceTimersByTime(400)
      await wrapper.vm.$nextTick()

      expect(wrapper.classes()).not.toContain('checkbox--just-checked')
    } finally {
      vi.useRealTimers()
    }
  })
```

- [ ] **Step 2: Run the new tests and verify they fail**

Run: `npm run test:run -- tests/components/ui/Checkbox.test.js`

Expected: the four new tests FAIL with no matching class (since the class doesn't exist yet). Existing Checkbox tests remain green.

- [ ] **Step 3: Implement the pulse in `Checkbox.vue`**

Open `src/components/ui/Checkbox.vue`. Replace the entire `<script>` block with:

```vue
<script>
/**
 * Checkbox — toggle button with checked/unchecked visual states and v-model
 * support.
 *
 * Implemented as a native `<button role="checkbox">` so keyboard activation
 * (Space and Enter — both trigger `click` on a button) works without an
 * explicit keydown handler. WAI-ARIA specifies Space as the canonical
 * activation key for `role="checkbox"`; Enter also toggles here, which is
 * mildly off-spec but generally accepted. Any future refactor to a
 * non-button element MUST add explicit keydown handlers for Space (and
 * preferably Enter) to preserve this behavior (WEB-W2-33).
 *
 * Pulse animation: a transient `--just-checked` class is applied for one
 * frame's worth of animation when `modelValue` transitions from false to
 * true, driving a keyframe scale-pulse. Initial mount with `modelValue: true`
 * does NOT pulse — only the user-initiated transition does.
 */
import { ref, watch, onBeforeUnmount } from 'vue'
import Icon from './Icon.vue'

const PULSE_MS = 320

export default {
  name: 'Checkbox',
  components: { Icon },
  props: {
    /** Checked state (v-model) */
    modelValue: { type: Boolean, default: false },
    /** Pixel size of the checkbox square */
    size: { type: Number, default: 20 },
    /** Whether the checkbox is disabled */
    disabled: { type: Boolean, default: false },
    /** Accessible label for the control */
    ariaLabel: { type: String, default: 'Complete' }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const justChecked = ref(false)
    let pulseTimer = null

    watch(
      () => props.modelValue,
      (val, prev) => {
        if (val && !prev) {
          justChecked.value = true
          if (pulseTimer) clearTimeout(pulseTimer)
          pulseTimer = setTimeout(() => {
            justChecked.value = false
            pulseTimer = null
          }, PULSE_MS)
        }
      }
    )

    onBeforeUnmount(() => {
      if (pulseTimer) clearTimeout(pulseTimer)
    })

    return { toggle, justChecked }

    // -- Function definitions --

    /** Toggle the checked state; no-ops when disabled. */
    function toggle() {
      if (!props.disabled) emit('update:modelValue', !props.modelValue)
    }
  }
}
</script>
```

- [ ] **Step 4: Add the `--just-checked` class binding to the template**

In the same file, replace the existing `<template>` block with:

```vue
<template>
  <button
    type="button"
    role="checkbox"
    :aria-checked="modelValue"
    :aria-label="ariaLabel"
    :disabled="disabled"
    class="checkbox"
    :class="[
      modelValue ? 'checkbox--checked' : 'checkbox--unchecked',
      { 'checkbox--just-checked': justChecked }
    ]"
    :style="{ '--checkbox-size': `${size}px` }"
    @click="toggle"
  >
    <Icon
      v-if="modelValue"
      name="check"
      :size="Math.round(size * 0.6)"
      class="checkbox__icon"
    />
  </button>
</template>
```

- [ ] **Step 5: Add the keyframe styles**

Replace the entire `<style lang="scss" scoped>` block with:

```vue
<style lang="scss" scoped>
.checkbox {
  // Width/height driven by a CSS custom property set inline by the consumer
  // via the `size` prop (WEB-W2-41). Keeps layout declarations in the
  // stylesheet rather than inline binding.
  width: var(--checkbox-size, 20px);
  height: var(--checkbox-size, 20px);

  @apply grid place-items-center rounded-pill border transition-colors disabled:opacity-50;
  @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;

  &--checked {
    @apply border-accent bg-accent;
  }

  &--unchecked {
    @apply border-rule-soft bg-paper-2 hover:border-muted;
  }

  &__icon {
    @apply text-accent-ink;
  }
}

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
</style>
```

- [ ] **Step 6: Run the Checkbox tests and verify they pass**

Run: `npm run test:run -- tests/components/ui/Checkbox.test.js`

Expected: PASS — all original Checkbox tests still green, plus the four new just-checked tests now pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/Checkbox.vue tests/components/ui/Checkbox.test.js
git commit -m "$(cat <<'EOF'
feat(ui): Checkbox pulses on false→true transition

Adds a transient checkbox--just-checked class driven by a watcher on
modelValue, gating a 280ms scale-pop keyframe. Initial mount with
modelValue: true does not pulse — only user-initiated check does.
Animations gated by prefers-reduced-motion.
EOF
)"
```

---

### Task 4: ProjectDetailView TransitionGroup + scoped animation styles

**Files:**
- Modify: `src/views/ProjectDetailView.vue`

This task has no new unit tests — animations are not reliably testable in jsdom and the existing `ProjectDetailView.test.js` covers the rendering. Manual verification happens in Task 6.

- [ ] **Step 1: Wrap the section task list in `<TransitionGroup>`**

Open `src/views/ProjectDetailView.vue`. Find the section-loop block in the template (around line 60). Replace this whole block:

```vue
        <div v-if="section.tasks.length" class="project-detail-view__task-list">
          <div
            v-for="task in section.tasks"
            :key="task.id"
            class="project-detail-view__task-item"
          >
            <Checkbox
              :model-value="task.done"
              @update:model-value="store.completeTask(task.id)"
            />

            <span
              class="project-detail-view__task-title"
              :class="task.done ? 'project-detail-view__task-title--done' : 'project-detail-view__task-title--open'"
            >
              {{ task.title }}
            </span>

            <Pill v-if="task.tag" variant="default">
              {{ task.tag }}
            </Pill>
          </div>
        </div>

        <p v-else class="project-detail-view__section-empty">
          {{ t('projects.noTasksHere') }}
        </p>
```

with this:

```vue
        <TransitionGroup
          v-if="section.tasks.length"
          name="task-complete"
          tag="div"
          class="project-detail-view__task-list"
        >
          <div
            v-for="task in section.tasks"
            :key="task.id"
            class="project-detail-view__task-item"
          >
            <Checkbox
              :model-value="task.done"
              @update:model-value="store.completeTask(task.id)"
            />

            <span
              class="project-detail-view__task-title"
              :class="task.done ? 'project-detail-view__task-title--done' : 'project-detail-view__task-title--open'"
            >
              {{ task.title }}
            </span>

            <Pill v-if="task.tag" variant="default">
              {{ task.tag }}
            </Pill>
          </div>
        </TransitionGroup>

        <p v-else class="project-detail-view__section-empty">
          {{ t('projects.noTasksHere') }}
        </p>
```

(`TransitionGroup` is a global Vue built-in — no import needed.)

- [ ] **Step 2: Add the transform transition to `__task-item`**

Inside the existing `<style lang="scss" scoped>` block, find the `&__task-item` rule (currently `&__task-item { @apply flex items-center gap-3.5 rounded-lg px-2 py-3 transition-colors hover:bg-paper-3; }`). Replace it with:

```scss
  &__task-item {
    @apply flex items-center gap-3.5 rounded-lg px-2 py-3 transition-colors hover:bg-paper-3;

    @media (prefers-reduced-motion: no-preference) {
      transition:
        background-color 150ms ease,
        color 150ms ease,
        transform 220ms cubic-bezier(0.4, 0, 0.2, 1);
    }
  }
```

The explicit `transition` inside the media query overrides Tailwind's `transition-colors` shorthand — we re-list `background-color` and `color` so hover transitions still work, and add `transform` so Vue's FLIP move animation can drive the neighbors gliding up.

- [ ] **Step 3: Append the `task-complete-*` Vue transition rules**

In the same `<style lang="scss" scoped>` block, after the closing `}` of the `.project-detail-view { … }` declaration (i.e. at top level inside the `<style>` block, not nested under `.project-detail-view`), append:

```scss
@media (prefers-reduced-motion: no-preference) {
  .task-complete-leave-active {
    transition:
      opacity 220ms ease-out,
      transform 220ms ease-out,
      max-height 220ms ease-out 80ms,
      margin 220ms ease-out 80ms,
      padding 220ms ease-out 80ms;
    overflow: hidden;
  }

  .task-complete-leave-from {
    max-height: 200px;
  }

  .task-complete-leave-to {
    opacity: 0;
    transform: translateX(8px);
    max-height: 0;
    margin-top: 0;
    margin-bottom: 0;
    padding-top: 0;
    padding-bottom: 0;
  }

  .task-complete-enter-active {
    transition:
      opacity 180ms ease-out 120ms,
      transform 180ms ease-out 120ms;
  }

  .task-complete-enter-from {
    opacity: 0;
    transform: translateY(-4px);
  }

  .task-complete-move {
    transition: transform 220ms cubic-bezier(0.4, 0, 0.2, 1);
  }
}
```

These class names are what Vue's `<TransitionGroup name="task-complete">` applies to entering, leaving, and moving items. The rules live at top level because Vue applies them directly to the `__task-item` elements as they enter/leave — they are not nested selectors.

- [ ] **Step 4: Run view tests to catch regressions**

Run: `npm run test:run -- tests/views/ProjectDetailView.test.js`

Expected: PASS — the TransitionGroup wrap is structurally compatible with the existing test stubs. If a test asserted a specific class structure that the TransitionGroup wrapper broke, update the assertion to match (the inner `__task-item` elements still exist and still carry their classes — only the wrapping element changed from `div` to `TransitionGroup` with `tag="div"`, which renders as a `div`).

- [ ] **Step 5: Run the full suite to be safe**

Run: `npm run test:run`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/views/ProjectDetailView.vue
git commit -m "$(cat <<'EOF'
feat(projects): animate task-complete in ProjectDetailView

Wraps each section's task list in <TransitionGroup name="task-complete">
with scoped fade-and-collapse leave, FLIP move for neighbors, and
fade-in enter for the row arriving in Done. Gated by
prefers-reduced-motion.
EOF
)"
```

---

### Task 5: KanbanView TransitionGroup + scoped animation styles

**Files:**
- Modify: `src/views/KanbanView.vue`

- [ ] **Step 1: Wrap the column cards in `<TransitionGroup>`**

Open `src/views/KanbanView.vue`. Find the column block in the template (around line 23). Replace this whole block:

```vue
        <div
          v-for="col in columns"
          :key="col.key"
          class="kanban-view__column"
        >
          <div class="kanban-view__column-header">
            <span class="kanban-view__column-label">
              {{ col.label }}
            </span>

            <span class="kanban-view__column-count">
              [{{ col.tasks.length }}]
            </span>
          </div>

          <KanbanCard
            v-for="task in col.tasks"
            :key="task.id"
            :task="task"
            @complete="store.completeTask"
          />

          <p v-if="!col.tasks.length" class="kanban-view__empty-col">
            {{ t('kanban.emptyColumn') }}
          </p>
        </div>
```

with this:

```vue
        <div
          v-for="col in columns"
          :key="col.key"
          class="kanban-view__column"
        >
          <div class="kanban-view__column-header">
            <span class="kanban-view__column-label">
              {{ col.label }}
            </span>

            <span class="kanban-view__column-count">
              [{{ col.tasks.length }}]
            </span>
          </div>

          <TransitionGroup
            name="task-complete"
            tag="div"
            class="kanban-view__column-tasks"
          >
            <KanbanCard
              v-for="task in col.tasks"
              :key="task.id"
              :task="task"
              @complete="store.completeTask"
            />
          </TransitionGroup>

          <p v-if="!col.tasks.length" class="kanban-view__empty-col">
            {{ t('kanban.emptyColumn') }}
          </p>
        </div>
```

- [ ] **Step 2: Add `__column-tasks` class + animation styles**

In the same file, inside the existing `<style lang="scss" scoped>` block, add a new `&__column-tasks` declaration alongside the other `&__*` rules inside `.kanban-view`:

```scss
  &__column-tasks {
    @apply flex flex-col gap-2;
  }
```

The existing `&__column { @apply flex flex-col gap-2 …; }` keeps its gap — that still spaces the header, the tasks wrapper, and the empty-state apart. The new `&__column-tasks` gap spaces the cards within the wrapper.

Then add the same top-level `.task-complete-*` rules used in `ProjectDetailView.vue` (these are scoped to this `<style>` block, so the rules from the other view do not leak — each view needs its own copy):

```scss
@media (prefers-reduced-motion: no-preference) {
  .task-complete-leave-active {
    transition:
      opacity 220ms ease-out,
      transform 220ms ease-out,
      max-height 220ms ease-out 80ms,
      margin 220ms ease-out 80ms,
      padding 220ms ease-out 80ms;
    overflow: hidden;
  }

  .task-complete-leave-from {
    max-height: 200px;
  }

  .task-complete-leave-to {
    opacity: 0;
    transform: translateX(8px);
    max-height: 0;
    margin-top: 0;
    margin-bottom: 0;
    padding-top: 0;
    padding-bottom: 0;
  }

  .task-complete-enter-active {
    transition:
      opacity 180ms ease-out 120ms,
      transform 180ms ease-out 120ms;
  }

  .task-complete-enter-from {
    opacity: 0;
    transform: translateY(-4px);
  }

  .task-complete-move {
    transition: transform 220ms cubic-bezier(0.4, 0, 0.2, 1);
  }
}
```

The `KanbanCard` component renders a `<div class="kanban-card">` at its root; Vue's TransitionGroup applies the `task-complete-*` classes to that root element, so the rules above target it without needing `:deep`. Confirmed by reading `src/components/projects/KanbanCard.vue`.

- [ ] **Step 3: Run view tests to catch regressions**

Run: `npm run test:run -- tests/views/KanbanView.test.js`

Expected: PASS. If a test asserted that `KanbanCard` was a direct child of `__column`, update it — cards are now wrapped in `__column-tasks`. The card itself and its props are unchanged.

- [ ] **Step 4: Run the full suite**

Run: `npm run test:run`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/views/KanbanView.vue
git commit -m "$(cat <<'EOF'
feat(projects): animate task-complete in KanbanView

Wraps each column's cards in <TransitionGroup name="task-complete">
within a new __column-tasks wrapper so the per-card gap is owned by
the wrapper. Same fade-collapse + FLIP move + fade-in pattern as
ProjectDetailView. Gated by prefers-reduced-motion.
EOF
)"
```

---

### Task 6: Manual verification

**Files:** none modified

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

Expected: Vite reports a local URL (e.g. `http://localhost:5173`). Open it in a browser and log in (or proceed however the mock auth flow expects).

- [ ] **Step 2: Verify the project detail view**

Navigate to `/projects`, pick a project with tasks across multiple sections, click into it (`/projects/:id`).

Check off a task in **This Week**. Verify all of:
- Checkbox fills with a brief scale-pop pulse.
- Title strikes through.
- Row fades right and collapses; neighbors glide up into the gap.
- No "Loading…" status block appears.
- The task appears at the top of the **Done** section with a soft fade-in.
- The Progress card's `done` count and percentage update in place.

Repeat from **Doing** and **Backlog** to confirm all three source columns work.

- [ ] **Step 3: Verify the kanban view**

Navigate to `/projects/:id/board`. Check off a task in any non-done column. Verify the card fades/collapses out of its column and reappears at the top of **Done**, with no loading flash.

- [ ] **Step 4: Verify slow-network resilience**

Open browser devtools → Network → throttling → "Slow 3G". Check off a task. Verify:
- The animation runs immediately (no wait for the network).
- The mutation request is visible in the Network panel.
- The UI never blanks; the user can keep working during the request.

- [ ] **Step 5: Verify error rollback**

Force the mutation to fail. Easiest path: in devtools Network panel, set the `completeProjectTask` request to "Block request URL", then check off a task.

Verify:
- The optimistic update plays.
- When the mutation fails, the row animates back into its original column.
- A red error toast appears with "Failed to complete task".
- `progress` returns to its original value.

Unblock the URL when done.

- [ ] **Step 6: Verify reduced-motion**

In OS settings, enable "Reduce motion":
- macOS: System Settings → Accessibility → Display → Reduce motion.
- Reload the browser tab.

Check off a task. Verify:
- No animation plays (no pulse, no fade, no collapse, no FLIP).
- The state still updates correctly and instantly.
- The view does not flash to "Loading…".

Disable "Reduce motion" when done.

- [ ] **Step 7: Stop the dev server and note results**

Stop the dev server. If any verification step failed, file the failure as a follow-up — the unit tests cover the optimistic behavior, but visual issues need their own debug pass.

No commit for this task — verification only.

---

## Done check

After all six tasks:
- `npm run test:run` is green.
- `git log --oneline` shows four feature commits (Tasks 2, 3, 4, 5) plus the earlier spec doc commit.
- Manual verification of the projects surface confirms instant updates with the animation playing.
