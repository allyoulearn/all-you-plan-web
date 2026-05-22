<template>
  <div>
    <RouterLink
      v-if="project"
      :to="`/projects/${route.params.id}`"
      class="kanban-view__back-link"
    >
      &larr; {{ project.name }}
    </RouterLink>

    <div v-if="store.loadingBoard" class="kanban-view__status kanban-view__status--mt">
      Loading…
    </div>

    <div v-else-if="store.errorBoard" class="kanban-view__status kanban-view__status--mt kanban-view__status--error">
      {{ store.errorBoard }}
    </div>

    <template v-else-if="project">
      <ScreenHeading :title="project.name" emphasis="by status." />

      <div class="kanban-view__board">
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
            Empty
          </p>
        </div>
      </div>
    </template>

    <div v-else class="kanban-view__status kanban-view__status--mt">
      Project not found.
      <RouterLink to="/projects" class="kanban-view__back-link">
        Back to projects
      </RouterLink>
    </div>
  </div>
</template>

<script>
/** KanbanView — project board with four status columns (backlog, this week, doing, done). */
import { onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useProjectsStore } from '@/stores/projects.store.js'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import KanbanCard from '@/components/projects/KanbanCard.vue'

export default {
  name: 'KanbanView',
  components: { RouterLink, ScreenHeading, KanbanCard },
  setup() {
    // -- State --
    const route = useRoute()
    const store = useProjectsStore()

    // -- Computed --

    /** The project object from the loaded board, or null if not yet loaded. */
    const project = computed(() => store.board?.project ?? null)

    /** The four kanban columns with their tasks. */
    const columns = computed(() => [
      { key: 'backlog', label: 'Backlog', tasks: store.board?.backlog ?? [] },
      { key: 'thisWeek', label: 'This week', tasks: store.board?.thisWeek ?? [] },
      { key: 'doing', label: 'Doing', tasks: store.board?.doing ?? [] },
      { key: 'done', label: 'Done', tasks: store.board?.done ?? [] },
    ])

    // -- Lifecycle --
    onMounted(() => store.loadBoard(route.params.id))

    return { route, store, project, columns }
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
    @apply grid grid-cols-4 gap-3.5;
  }

  &__column {
    @apply flex flex-col gap-2 rounded-md bg-paper-2 p-3;
  }

  &__column-header {
    @apply mb-1 flex items-baseline gap-2;
  }

  &__column-label {
    @apply text-[12px] font-medium text-ink;
  }

  &__column-count {
    @apply font-mono text-[11px] text-muted;
  }

  &__empty-col {
    @apply text-[12px] text-muted;
  }
}
</style>
