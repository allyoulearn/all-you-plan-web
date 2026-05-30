<template>
  <div class="kanban-view">
    <!-- Loading state -->
    <div v-if="store.loadingBoard" class="kanban-view__status kanban-view__status--mt">
      {{ t('common.loading') }}
    </div>

    <!-- Error state -->
    <div
      v-else-if="store.errorBoard"
      class="kanban-view__status kanban-view__status--mt kanban-view__status--error"
    >
      {{ store.errorBoard }}
    </div>

    <!-- Board content -->
    <template v-else-if="project && localBoard">
      <!-- Screen heading -->
      <AppScreenHeading :title="project.name" :emphasis="t('kanban.byStatus')" />

      <!-- Filter bar: search + priority chips + hide-done toggle. The
           filters are local to the view (no URL persistence) and applied
           via `displayedTasksFor(col.id)` below. -->
      <div class="kanban-view__filter-bar">
        <label class="kanban-view__filter-search">
          <AppIcon name="search" :size="14" aria-hidden="true" />

          <input
            v-model="filters.search"
            type="search"
            :placeholder="t('kanban.filterSearchPlaceholder')"
            class="kanban-view__filter-input"
          />
        </label>

        <span class="kanban-view__filter-label">
          {{ t('kanban.filterPriorityLabel') }}
        </span>

        <button
          v-for="p in PRIORITY_OPTIONS"
          :key="p"
          type="button"
          :class="[
            'kanban-view__filter-chip',
            `kanban-view__filter-chip--${p}`,
            { 'kanban-view__filter-chip--active': filters.priorities.includes(p) }
          ]"
          @click="togglePriorityFilter(p)"
        >
          {{ t(`tasks.priority${p.charAt(0).toUpperCase() + p.slice(1)}`) }}
        </button>

        <label class="kanban-view__filter-toggle">
          <input v-model="filters.hideDone" type="checkbox" />
          {{ t('kanban.filterHideDone') }}
        </label>

        <button
          v-if="hasActiveFilter"
          type="button"
          class="kanban-view__filter-clear"
          @click="clearFilters"
        >
          {{ t('kanban.filterClear') }}
        </button>
      </div>

      <!-- Bordered frame around the scrollable board so the right-edge cut-off
           reads as "viewport into a wider canvas" rather than a faded shadow.
           The frame clips overflow; the inner draggable handles horizontal
           scroll. -->
      <div class="kanban-view__board-frame">
        <draggable
          v-model="localBoard.columns"
          item-key="id"
          handle=".kanban-view__column-header"
          :animation="180"
          class="kanban-view__board"
          @end="onColumnDragEnd"
        >
          <template #item="{ element: col }">
            <div class="kanban-view__column" :data-column-id="col.id">
              <header class="kanban-view__column-header">
                <span class="kanban-view__column-label" :title="t('kanban.dragHandleHint')">
                  {{ col.label }}
                </span>

                <span class="kanban-view__column-count">
                  [{{ displayedTasksFor(col.id).length }}]
                </span>

                <ColumnHeaderMenu
                  @rename="openRenameFor(col)"
                  @delete="openDeleteFor(col)"
                />
              </header>

              <draggable
                :list="getTasksRef(col.id)"
                item-key="id"
                group="kanban-tasks"
                :animation="180"
                class="kanban-view__column-tasks"
                :data-column-id="col.id"
                @end="onTaskDragEnd"
              >
                <template #item="{ element: task }">
                  <KanbanCard
                    v-show="taskMatchesFilter(task)"
                    :task="task"
                    @complete="store.completeTask"
                    @open="openTaskDetail"
                  />
                </template>
              </draggable>

              <p v-if="!displayedTasksFor(col.id).length" class="kanban-view__empty-col">
                {{ hasActiveFilter ? t('kanban.filterEmptyMatch') : t('kanban.emptyColumn') }}
              </p>
            </div>
          </template>

          <template #footer>
            <AddColumnButton :saving="store.saving" @create="onAddColumn" />
          </template>
        </draggable>
      </div>
    </template>

    <!-- Not found state -->
    <div v-else class="kanban-view__status kanban-view__status--mt">
      {{ t('kanban.notFound') }}

      <RouterLink to="/projects" class="kanban-view__back-link">
        {{ t('kanban.notFoundBack') }}
      </RouterLink>
    </div>

    <!-- Rename column modal -->
    <RenameColumnModal
      v-model="renameOpen"
      :initial-label="renameTarget?.label ?? ''"
      :saving="store.saving"
      @submit="onRenameSubmit"
    />

    <!-- Delete column dialog -->
    <DeleteColumnDialog
      v-model="deleteOpen"
      :column="deleteTarget"
      :task-count="deleteTaskCount"
      :move-targets="deleteMoveTargets"
      :saving="store.saving"
      @confirm="onDeleteConfirm"
    />

    <!-- Task detail modal -->
    <TaskDetailModal
      v-model="detailOpen"
      :task="detailTask"
      :columns="localBoard?.columns ?? []"
      :busy="store.saving"
      @save="onTaskSave"
      @delete-task="onTaskDelete"
      @add-subtask="onAddSubtask"
      @update-subtask="onUpdateSubtask"
      @delete-subtask="onDeleteSubtask"
    />
  </div>
</template>

<script>
/**
 * KanbanView — project board with per-project custom columns. Supports
 * drag-and-drop for tasks (between and within columns) and for columns
 * themselves. Completion is decoupled from columns: clicking a card's
 * checkbox toggles done in place without moving the card.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import draggable from 'vuedraggable'
import { useProjectsStore } from '@/stores/projects.store.js'
import AppScreenHeading from '@/components/ui/AppScreenHeading.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import KanbanCard from '@/components/projects/KanbanCard.vue'
import ColumnHeaderMenu from '@/components/projects/ColumnHeaderMenu.vue'
import RenameColumnModal from '@/components/projects/RenameColumnModal.vue'
import DeleteColumnDialog from '@/components/projects/DeleteColumnDialog.vue'
import AddColumnButton from '@/components/projects/AddColumnButton.vue'
import TaskDetailModal from '@/components/tasks/TaskDetailModal.vue'

/**
 * Deep-clone a board so vuedraggable can mutate the local copy without
 * touching Apollo's frozen result. Cheap for personal-scale data
 * (dozens of tasks at most).
 */
function cloneBoard(board) {
  if (!board) return null
  return {
    project: board.project,
    columns: board.columns.map(c => ({ ...c })),
    tasksByColumn: board.tasksByColumn.map(t => ({
      columnId: t.columnId,
      tasks: t.tasks.map(task => ({ ...task }))
    }))
  }
}

export default {
  name: 'KanbanView',
  components: {
    RouterLink,
    AppScreenHeading,
    AppIcon,
    KanbanCard,
    draggable,
    ColumnHeaderMenu,
    RenameColumnModal,
    DeleteColumnDialog,
    AddColumnButton,
    TaskDetailModal
  },
  setup() {
    const route = useRoute()
    const store = useProjectsStore()
    const { t } = useI18n()

    /** Priorities the chip group exposes, in display order. */
    const PRIORITY_OPTIONS = ['urgent', 'high', 'normal', 'low']

    // Client-side filter state, scoped to this view (intentionally not
    // persisted to the URL — board filters are an exploratory affordance,
    // not a shareable view).
    const filters = ref({
      search: '',
      priorities: [],
      hideDone: false
    })

    // Local clone of the board state that vuedraggable can mutate freely.
    // Synced from the store only on structural changes — full loads, column
    // create/rename/delete, project switches. Task-level reorders DO NOT
    // re-clone from the store: the local arrays already hold the post-drag
    // order, and re-cloning would hand vuedraggable a new array reference
    // mid-gesture and race the SortableJS DOM choreography.
    const localBoard = ref(cloneBoard(store.board))

    let lastFingerprint = structuralFingerprint(store.board)

    watch(
      () => store.board,
      b => {
        const fingerprint = structuralFingerprint(b)

        if (fingerprint !== lastFingerprint) {
          lastFingerprint = fingerprint
          localBoard.value = cloneBoard(b)
        }
        // Same structure → leave localBoard alone so vuedraggable's array
        // references stay stable across drag operations.
      },
      { deep: false }
    )

    const project = computed(() => localBoard.value?.project ?? store.board?.project ?? null)

    // Column action menu state
    const renameOpen = ref(false)
    const renameTarget = ref(null)

    const deleteOpen = ref(false)
    const deleteTarget = ref(null)

    const deleteTaskCount = computed(() =>
      deleteTarget.value ? tasksFor(deleteTarget.value.id).length : 0
    )

    const deleteMoveTargets = computed(() => {
      if (!deleteTarget.value || !localBoard.value) return []
      return localBoard.value.columns.filter(c => c.id !== deleteTarget.value.id)
    })

    // Task detail modal — opens when a card is clicked. We keep a separate
    // ref for the active task so the modal contents survive a store-side
    // refresh (which would otherwise unmount the row mid-edit).
    const detailOpen = ref(false)
    const detailTaskId = ref(null)

    const detailTask = computed(() => {
      if (!detailTaskId.value || !localBoard.value) return null

      for (const entry of localBoard.value.tasksByColumn ?? []) {
        const t = entry.tasks.find(x => x.id === detailTaskId.value)
        if (t) return t
      }

      return null
    })

    onMounted(() => store.loadBoard(route.params.id))

    /** True when any filter is doing something — drives the Clear button. */
    const hasActiveFilter = computed(
      () =>
        filters.value.search.trim().length > 0 ||
        filters.value.priorities.length > 0 ||
        filters.value.hideDone
    )

    return {
      route,
      store,
      project,
      localBoard,
      tasksFor,
      displayedTasksFor,
      taskMatchesFilter,
      getTasksRef,
      onColumnDragEnd,
      onTaskDragEnd,
      renameOpen,
      renameTarget,
      openRenameFor,
      onRenameSubmit,
      deleteOpen,
      deleteTarget,
      deleteTaskCount,
      deleteMoveTargets,
      openDeleteFor,
      onDeleteConfirm,
      onAddColumn,
      detailOpen,
      detailTask,
      openTaskDetail,
      onTaskSave,
      onTaskDelete,
      onAddSubtask,
      onUpdateSubtask,
      onDeleteSubtask,
      filters,
      hasActiveFilter,
      togglePriorityFilter,
      clearFilters,
      PRIORITY_OPTIONS,
      t
    }

    // -- Function definitions --

    /**
     * Does a task pass the current filter set? Used in two places — the
     * card-level v-show (to hide individual cards) and `displayedTasksFor`
     * (to drive the column count and empty-state message).
     */
    function taskMatchesFilter(task) {
      const f = filters.value
      if (f.hideDone && task.done) return false

      if (f.priorities.length && !f.priorities.includes(task.priority || 'normal')) {
        return false
      }

      if (f.search.trim()) {
        const needle = f.search.trim().toLowerCase()
        const hay = `${task.title ?? ''} ${task.note ?? ''}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }

      return true
    }

    /** Filtered view of a column's tasks — drives the count + empty state. */
    function displayedTasksFor(columnId) {
      return tasksFor(columnId).filter(taskMatchesFilter)
    }

    /** Toggle a priority chip on/off; multi-select OR. */
    function togglePriorityFilter(p) {
      const list = filters.value.priorities
      const idx = list.indexOf(p)
      if (idx === -1) list.push(p)
      else list.splice(idx, 1)
    }

    /** Reset all filters back to the unfiltered default. */
    function clearFilters() {
      filters.value = { search: '', priorities: [], hideDone: false }
    }

    /** Last "fingerprint" of the store's column structure we mirrored from.
     *  A new fingerprint means structural change → re-clone. Same fingerprint
     *  means only task arrangement changed → skip the re-clone. */
    function structuralFingerprint(board) {
      if (!board) return ''
      const projectId = board.project?.id ?? ''
      const columns = (board.columns ?? []).map(c => `${c.id}:${c.label}:${c.order}`).join('|')
      return `${projectId}#${columns}`
    }

    /**
     * Returns the task list for a given column id.
     * @param {string} columnId
     * @returns {Array}
     */
    function tasksFor(columnId) {
      const entry = localBoard.value?.tasksByColumn?.find(t => t.columnId === columnId)
      return entry?.tasks ?? []
    }

    /**
     * Vuedraggable mutates the array reference passed to `:list`. Return the
     * actual array reference so it can splice items in place.
     */
    function getTasksRef(columnId) {
      const entry = localBoard.value?.tasksByColumn?.find(t => t.columnId === columnId)
      // vuedraggable expects an array; fall back to an inert empty if the
      // column was just created and tasksByColumn hasn't caught up yet.
      if (!entry) return []
      return entry.tasks
    }

    /**
     * Persist a column reorder after vuedraggable mutates the local board.
     * Skips the round trip when the order is unchanged and rolls the local
     * board back from the store on failure.
     */
    function onColumnDragEnd() {
      if (!localBoard.value) return
      const columnIds = localBoard.value.columns.map(c => c.id)
      const original = store.board?.columns?.map(c => c.id) ?? []

      // Skip the network round trip when the order didn't change (a click on
      // the column header that didn't move anything still fires @end).
      if (columnIds.length === original.length && columnIds.every((id, i) => id === original[i])) {
        return
      }

      store
        .reorderColumns(project.value.id, columnIds)
        .catch(() => {
          localBoard.value = cloneBoard(store.board)
        })
    }

    /**
     * Persist a task drag — either an in-column reorder or a cross-column move.
     * Reads source/destination from the vuedraggable end event's dataset.
     * @param {object} evt - vuedraggable end event.
     */
    function onTaskDragEnd(evt) {
      if (!localBoard.value) return
      const fromColumnId = evt.from?.dataset?.columnId
      const toColumnId = evt.to?.dataset?.columnId
      if (!fromColumnId || !toColumnId) return
      const newIndex = evt.newIndex ?? 0
      const toEntry = localBoard.value.tasksByColumn.find(t => t.columnId === toColumnId)
      const movedTask = toEntry?.tasks[newIndex]
      if (!movedTask) return

      const next = localBoard.value.tasksByColumn

      if (fromColumnId === toColumnId) {
        if (evt.oldIndex === newIndex) return

        store
          .reorderTasksInColumn(
            toColumnId,
            toEntry.tasks.map(t => t.id),
            next
          )
          .catch(() => {
            localBoard.value = cloneBoard(store.board)
          })

        return
      }

      store
        .moveTask(movedTask.id, fromColumnId, toColumnId, newIndex, next)
        .catch(() => {
          localBoard.value = cloneBoard(store.board)
        })
    }

    /**
     * Open the rename-column modal targeting the given column.
     * @param {{ id: string, label: string }} col
     */
    function openRenameFor(col) {
      renameTarget.value = col
      renameOpen.value = true
    }

    /**
     * Submit a column rename. Closes the modal on success and leaves it open
     * on failure so the store's toast is the only error affordance.
     * @param {string} label
     */
    async function onRenameSubmit(label) {
      const target = renameTarget.value
      if (!target) return

      try {
        await store.renameColumn(target.id, label)
        renameOpen.value = false
      } catch {
        // Toast already surfaced by the store; keep dialog open.
      }
    }

    /**
     * Open the delete-column dialog targeting the given column.
     * @param {{ id: string, label: string }} col
     */
    function openDeleteFor(col) {
      deleteTarget.value = col
      deleteOpen.value = true
    }

    /**
     * Confirm a column deletion, optionally moving its tasks to another column.
     * @param {{ mode: string, moveToColumnId?: string }} payload
     */
    async function onDeleteConfirm({ mode, moveToColumnId }) {
      const target = deleteTarget.value
      if (!target) return

      try {
        await store.deleteColumn(target.id, mode, moveToColumnId)
        deleteOpen.value = false
      } catch {
        // Toast already surfaced; keep dialog open.
      }
    }

    /**
     * Create a new column on the current project.
     * @param {string} label
     */
    async function onAddColumn(label) {
      if (!project.value) return

      try {
        await store.createColumn(project.value.id, label)
      } catch {
        // Toast already surfaced.
      }
    }

    /**
     * Open the task detail modal for the given task.
     * @param {{ id: string }} task
     */
    function openTaskDetail(task) {
      detailTaskId.value = task.id
      detailOpen.value = true
    }

    /**
     * Persist task detail edits. A no-op patch closes the modal; otherwise
     * the modal stays open on error so the store toast can surface.
     * @param {object} updates
     */
    async function onTaskSave(updates) {
      if (!detailTaskId.value || Object.keys(updates).length === 0) {
        detailOpen.value = false
        return
      }

      try {
        await store.updateTask(detailTaskId.value, updates)
        detailOpen.value = false
      } catch {
        // Toast surfaced; keep modal open.
      }
    }

    /** Delete the currently focused task and close the detail modal on success. */
    async function onTaskDelete() {
      if (!detailTaskId.value) return

      try {
        await store.deleteTask(detailTaskId.value)
        detailOpen.value = false
      } catch {
        // Toast surfaced.
      }
    }

    /**
     * Add a subtask to the currently focused task.
     * @param {{ text: string }} payload
     */
    function onAddSubtask({ text }) {
      if (!detailTaskId.value) return
      store.addSubtask(detailTaskId.value, text).catch(() => {})
    }

    /**
     * Patch a subtask on the currently focused task.
     * @param {{ subtaskId: string }} payload - subtaskId plus the patch fields.
     */
    function onUpdateSubtask({ subtaskId, ...patch }) {
      if (!detailTaskId.value) return
      store.updateSubtask(detailTaskId.value, subtaskId, patch).catch(() => {})
    }

    /**
     * Delete a subtask from the currently focused task.
     * @param {{ subtaskId: string }} payload
     */
    function onDeleteSubtask({ subtaskId }) {
      if (!detailTaskId.value) return
      store.deleteSubtask(detailTaskId.value, subtaskId).catch(() => {})
    }
  }
}
</script>

<style lang="scss" scoped>
.kanban-view {
  // Root flexes vertically so the board frame can `flex: 1` and reach the
  // bottom of the available space precisely, instead of relying on a brittle
  // `min-height: calc(100vh - 240px)` that breaks any time the chrome above
  // changes height.
  @apply flex h-full flex-col;

  &__back-link {
    @apply font-mono text-[12px] text-muted hover:text-ink;
  }

  &__status {
    @apply text-[13px] text-muted;

    &--mt {
      @apply mt-4;
    }

    &--error {
      @apply text-bad;
    }
  }

  // Visible frame around the scrollable board. The border alone makes the
  // wrapper read as a "viewport into a wider canvas"; columns visibly clip
  // at the right edge so the user understands they can scroll for more — no
  // shadow trickery needed. Background stays transparent so the column tint
  // (already paper-2) still pops against the page paper background instead
  // of merging into a same-coloured frame. `flex: 1` lets the frame absorb
  // whatever vertical room is left over after the heading + filter bar — no
  // brittle min-height math required.
  &__board-frame {
    @apply flex flex-1 flex-col overflow-hidden rounded-lg border border-rule-soft;
    min-height: 0;
  }

  &__board {
    // Horizontal scroll surface inside the frame. flex-1 grows the strip to
    // fill the frame's height so the columns sit on a tall canvas. Custom
    // scrollbar tracks the theme via color-mix so it doesn't render as the
    // default OS chrome over a tinted background.
    @apply flex flex-1 items-start gap-3.5 overflow-x-auto p-4;

    scrollbar-width: thin;
    scrollbar-color: color-mix(in oklab, var(--ink) 18%, transparent) transparent;

    &::-webkit-scrollbar {
      height: 10px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: color-mix(in oklab, var(--ink) 18%, transparent);
      border-radius: 5px;

      &:hover {
        background: color-mix(in oklab, var(--ink) 30%, transparent);
      }
    }
  }

  &__filter-bar {
    @apply mb-4 flex flex-wrap items-center gap-2 text-[12px] text-muted;
  }

  &__filter-search {
    @apply inline-flex items-center gap-1.5 rounded-pill border border-rule-soft bg-paper-2 px-2.5 py-1.5;
    color: var(--ink);

    &:focus-within {
      border-color: var(--ink);
    }
  }

  &__filter-input {
    @apply w-44 bg-transparent text-[12px] outline-none;
    color: var(--ink);

    &::placeholder {
      color: var(--muted);
    }
  }

  &__filter-label {
    @apply ml-2 font-mono text-[11px] uppercase tracking-wider;
  }

  &__filter-chip {
    @apply inline-flex cursor-pointer items-center gap-1.5 rounded-pill border border-rule-soft px-2.5 py-1 text-[11px] transition-colors;

    &::before {
      content: '';
      @apply h-1.5 w-1.5 rounded-full;
      background: var(--muted);
    }

    &:hover {
      color: var(--ink);
    }

    &--active {
      background: var(--paper-3);
      border-color: var(--ink);
      color: var(--ink);
    }

    // Priority dots — match the dot colors used on KanbanCard so the chip
    // reads as the same affordance the user already learned from the card.
    &--urgent::before { background: var(--bad, #c4452b); }
    &--high::before { background: #d99022; }
    &--normal::before { background: #b6b09a; }
    &--low::before { background: color-mix(in oklab, var(--muted) 60%, transparent); }
  }

  &__filter-toggle {
    @apply ml-2 inline-flex cursor-pointer items-center gap-1.5 text-[12px];
    color: var(--muted);

    input {
      @apply h-3.5 w-3.5 cursor-pointer accent-current;
    }

    &:hover {
      color: var(--ink);
    }
  }

  &__filter-clear {
    @apply ml-auto cursor-pointer rounded-pill px-2 py-1 text-[11px] underline-offset-2;
    color: var(--muted);

    &:hover {
      color: var(--ink);
      text-decoration: underline;
    }
  }

  &__column {
    @apply flex w-72 shrink-0 flex-col gap-2 rounded-md bg-paper-2 p-3;
  }

  &__column-header {
    @apply mb-1 flex cursor-grab items-baseline gap-2 select-none;

    &:active {
      @apply cursor-grabbing;
    }
  }

  &__column-label {
    @apply min-w-0 flex-1 truncate text-[12px] font-medium text-ink;
  }

  &__column-count {
    @apply font-mono text-[11px] text-muted;
  }

  &__column-tasks {
    @apply flex min-h-[40px] flex-col gap-2;
  }

  &__empty-col {
    @apply text-[12px] text-muted;
  }
}

/* vuedraggable's helper classes — fade ghost, raise the dragged card. */
:deep(.sortable-ghost) {
  @apply opacity-40;
}

:deep(.sortable-chosen) {
  @apply shadow-md;
}

:deep(.sortable-drag) {
  @apply opacity-90;
}
</style>
