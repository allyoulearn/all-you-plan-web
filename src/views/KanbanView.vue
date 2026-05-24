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

    <div v-else-if="store.errorBoard" class="kanban-view__status kanban-view__status--mt kanban-view__status--error">
      {{ store.errorBoard }}
    </div>

    <template v-else-if="project">
      <ScreenHeading :title="project.name" :emphasis="t('kanban.byStatus')" />

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
      </div>
    </template>

    <div v-else class="kanban-view__status kanban-view__status--mt">
      {{ t('kanban.notFound') }}
      <RouterLink to="/projects" class="kanban-view__back-link">
        {{ t('kanban.notFoundBack') }}
      </RouterLink>
    </div>
  </div>
</template>

<script>
/** KanbanView — project board with four status columns (backlog, this week, doing, done). */
import { onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProjectsStore } from '@/stores/projects.store.js'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import KanbanCard from '@/components/projects/KanbanCard.vue'
import Icon from '@/components/ui/Icon.vue'

export default {
  name: 'KanbanView',
  components: { RouterLink, ScreenHeading, KanbanCard, Icon },
  setup() {
    // -- State --
    const route = useRoute()
    const store = useProjectsStore()
    const { t } = useI18n()

    // -- Computed --

    /** The project object from the loaded board, or null if not yet loaded. */
    const project = computed(() => store.board?.project ?? null)

    /** The four kanban columns with their tasks, labelled via i18n (WEB-W4-05). */
    const columns = computed(() => [
      { key: 'backlog', label: t('kanban.columnBacklog'), tasks: store.board?.backlog ?? [] },
      { key: 'thisWeek', label: t('kanban.columnThisWeek'), tasks: store.board?.thisWeek ?? [] },
      { key: 'doing', label: t('kanban.columnDoing'), tasks: store.board?.doing ?? [] },
      { key: 'done', label: t('kanban.columnDone'), tasks: store.board?.done ?? [] },
    ])

    // -- Lifecycle --
    onMounted(() => store.loadBoard(route.params.id))

    return { route, store, project, columns, t }
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

  &__column-tasks {
    @apply flex flex-col gap-2;
  }

  &__empty-col {
    @apply text-[12px] text-muted;
  }
}

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
</style>
