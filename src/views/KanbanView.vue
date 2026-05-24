<template>
  <div>
    <RouterLink
      v-if="project"
      :to="`/projects/${route.params.id}`"
      class="kanban-view__back-link"
    >
      <Icon name="arrow-left" :size="14" /> {{ project.name }}
    </RouterLink>

    <div v-if="store.loadingBoard" class="kanban-view__status kanban-view__status--mt">
      {{ t('common.loading') }}
    </div>

    <div
      v-else-if="store.errorBoard"
      class="kanban-view__status kanban-view__status--mt kanban-view__status--error"
    >
      {{ store.errorBoard }}
    </div>

    <template v-else-if="project && localBoard">
      <ScreenHeading :title="project.name" :emphasis="t('kanban.byStatus')" />

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
                [{{ tasksFor(col.id).length }}]
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
                  :task="task"
                  @complete="store.completeTask"
                  @open="openTaskDetail"
                />
              </template>
            </draggable>

            <p v-if="!tasksFor(col.id).length" class="kanban-view__empty-col">
              {{ t('kanban.emptyColumn') }}
            </p>
          </div>
        </template>

        <template #footer>
          <AddColumnButton :saving="store.saving" @create="onAddColumn" />
        </template>
      </draggable>
    </template>

    <div v-else class="kanban-view__status kanban-view__status--mt">
      {{ t('kanban.notFound') }}

      <RouterLink to="/projects" class="kanban-view__back-link">
        {{ t('kanban.notFoundBack') }}
      </RouterLink>
    </div>

    <RenameColumnModal
      v-model="renameOpen"
      :initial-label="renameTarget?.label ?? ''"
      :saving="store.saving"
      @submit="onRenameSubmit"
    />

    <DeleteColumnDialog
      v-model="deleteOpen"
      :column="deleteTarget"
      :task-count="deleteTaskCount"
      :move-targets="deleteMoveTargets"
      :saving="store.saving"
      @confirm="onDeleteConfirm"
    />

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
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import Icon from '@/components/ui/Icon.vue'
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
    ScreenHeading,
    Icon,
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

    // Local clone of the board state that vuedraggable can mutate freely.
    // Resynced from the store whenever store.board changes (load, error
    // rollback, server-side reload).
    const localBoard = ref(cloneBoard(store.board))

    watch(
      () => store.board,
      b => {
        localBoard.value = cloneBoard(b)
      },
      { deep: false }
    )

    const project = computed(() => localBoard.value?.project ?? store.board?.project ?? null)

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

    // Column action menu state
    const renameOpen = ref(false)
    const renameTarget = ref(null)
    function openRenameFor(col) {
      renameTarget.value = col
      renameOpen.value = true
    }
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

    const deleteOpen = ref(false)
    const deleteTarget = ref(null)
    const deleteTaskCount = computed(() =>
      deleteTarget.value ? tasksFor(deleteTarget.value.id).length : 0
    )
    const deleteMoveTargets = computed(() => {
      if (!deleteTarget.value || !localBoard.value) return []
      return localBoard.value.columns.filter(c => c.id !== deleteTarget.value.id)
    })
    function openDeleteFor(col) {
      deleteTarget.value = col
      deleteOpen.value = true
    }
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

    async function onAddColumn(label) {
      if (!project.value) return
      try {
        await store.createColumn(project.value.id, label)
      } catch {
        // Toast already surfaced.
      }
    }

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
    function openTaskDetail(task) {
      detailTaskId.value = task.id
      detailOpen.value = true
    }
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
    async function onTaskDelete() {
      if (!detailTaskId.value) return
      try {
        await store.deleteTask(detailTaskId.value)
        detailOpen.value = false
      } catch {
        // Toast surfaced.
      }
    }
    function onAddSubtask({ text }) {
      if (!detailTaskId.value) return
      store.addSubtask(detailTaskId.value, text).catch(() => {})
    }
    function onUpdateSubtask({ subtaskId, ...patch }) {
      if (!detailTaskId.value) return
      store.updateSubtask(detailTaskId.value, subtaskId, patch).catch(() => {})
    }
    function onDeleteSubtask({ subtaskId }) {
      if (!detailTaskId.value) return
      store.deleteSubtask(detailTaskId.value, subtaskId).catch(() => {})
    }

    onMounted(() => store.loadBoard(route.params.id))

    return {
      route,
      store,
      project,
      localBoard,
      tasksFor,
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
      t
    }
  }
}
</script>

<style lang="scss" scoped>
.kanban-view {
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

  &__board {
    @apply flex items-start gap-3.5 overflow-x-auto pb-3;
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
