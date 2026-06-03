<template>
  <div class="tasks-view">
    <!-- Screen heading -->
    <AppScreenHeading
      :eyebrow="`${t('nav.itemTasks')} · ${openCount} ${t('tasksWorkspace.open')}`"
      :title="t('tasksWorkspace.headingPrefix')"
      :emphasis="t('tasksWorkspace.headingEmphasis')"
    >
      <template v-if="store.summary" #meta>
        <span class="tasks-view__meta-line">
          {{ t('tasksWorkspace.metaCounts', { overdue: store.summary.overdue, dated: store.summary.dated }) }}
        </span>

        <span class="tasks-view__meta-line">
          {{ t('tasksWorkspace.metaDoneRecently', { count: store.summary.doneRecently }) }}
        </span>
      </template>
    </AppScreenHeading>

    <!-- Loading state -->
    <div v-if="store.loading && !loaded" class="tasks-view__status">
      {{ t('common.loading') }}
    </div>

    <!-- Error state -->
    <div v-else-if="store.error" class="tasks-view__status tasks-view__status--error">
      <span>
        {{ store.error }}
      </span>

      <AppButton size="sm" variant="ghost" @click="store.load()">
        {{ t('common.retry') }}
      </AppButton>
    </div>

    <!-- Content -->
    <template v-else-if="loaded">
      <!-- Urgency summary strip -->
      <UrgencySummary :summary="store.summary" :upcoming="upcomingCount" @select="onSummarySelect" />

      <!-- Controls bar -->
      <div class="tasks-view__controls">
        <AppSegmentedControl
          :model-value="store.groupBy"
          :options="groupByOptions"
          :group-label="t('tasksWorkspace.groupBy')"
          @update:model-value="store.setGroupBy"
        />

        <span class="tasks-view__ctl-label">
          {{ t('tasksWorkspace.groupBy') }}
        </span>

        <span class="tasks-view__spacer" />

        <AppButton variant="ghost" icon="check" @click="store.toggleShowDone()">
          {{ store.showDone ? t('tasksWorkspace.hideDone') : t('tasksWorkspace.showDone', { count: doneCount }) }}
        </AppButton>

        <AppButton variant="primary" icon="plus" @click="showCreate = true">
          {{ t('tasksWorkspace.newTask') }}
        </AppButton>
      </div>

      <!-- Category filter pills -->
      <CategoryFilter
        :model-value="store.categoryFilter"
        :categories="store.categoriesPresent"
        @update:model-value="store.setCategoryFilter"
      />

      <!-- Empty state -->
      <AppCard v-if="store.groups.length === 0" class="tasks-view__empty">
        <p class="tasks-view__empty-title">
          {{ t('tasksWorkspace.emptyTitle') }}
        </p>

        <p class="tasks-view__empty-body">
          {{ t('tasksWorkspace.emptyBody') }}
        </p>
      </AppCard>

      <!-- Grouped task lists -->
      <TaskGroup
        v-for="group in store.groups"
        :key="group.key"
        :group="group"
        @complete="onComplete"
      />

      <!-- Footer note -->
      <p class="tasks-view__footer">
        {{ t('tasksWorkspace.footerNote') }}
      </p>
    </template>

    <!-- Create task modal -->
    <CreateTaskModal v-model="showCreate" />
  </div>
</template>

<script>
/**
 * TasksView — the unified Tasks workspace: an urgency summary strip, a
 * group-by control + show-done toggle + New task action, category filter
 * pills, and the grouped task lists. Grouping and filtering are computed in
 * the store from a flat list; this view is mostly composition + wiring.
 */
import { onMounted, computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTasksStore } from '@/stores/tasks.store.js'
import AppScreenHeading from '@/components/ui/AppScreenHeading.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppSegmentedControl from '@/components/ui/AppSegmentedControl.vue'
import UrgencySummary from '@/components/tasks/UrgencySummary.vue'
import CategoryFilter from '@/components/tasks/CategoryFilter.vue'
import TaskGroup from '@/components/tasks/TaskGroup.vue'
import CreateTaskModal from '@/components/tasks/CreateTaskModal.vue'

export default {
  name: 'TasksView',
  components: {
    AppScreenHeading,
    AppButton,
    AppCard,
    AppSegmentedControl,
    UrgencySummary,
    CategoryFilter,
    TaskGroup,
    CreateTaskModal
  },
  setup() {
    const store = useTasksStore()
    const { t } = useI18n()
    const loaded = ref(false)
    const showCreate = ref(false)

    const groupByOptions = computed(() => [
      { value: 'urgency', label: t('tasksWorkspace.byUrgency') },
      { value: 'category', label: t('tasksWorkspace.byCategory') },
      { value: 'due', label: t('tasksWorkspace.byDue') }
    ])

    /** Open (not-done) task count for the eyebrow. */
    const openCount = computed(() => store.tasks.filter(taskItem => !taskItem.done).length)

    /** Count of done tasks currently loaded (only present when showDone). */
    const doneCount = computed(() =>
      store.showDone
        ? store.tasks.filter(taskItem => taskItem.done).length
        : (store.summary?.doneRecently ?? 0)
    )

    /**
     * Upcoming deadlines = open tasks with a due date inside the next 7 days
     * (not overdue). The summary's `dated` includes far-future deadlines, so
     * we derive the 7-day window here for the strip's last cell.
     */
    const upcomingCount = computed(
      () =>
        store.tasks.filter(
          taskItem =>
            !taskItem.done &&
            taskItem.due &&
            taskItem.due.daysLeft >= 0 &&
            taskItem.due.daysLeft <= 7
        ).length
    )

    onMounted(async () => {
      await store.load()
      loaded.value = true
    })

    watch(
      () => store.loading,
      isLoading => {
        if (!isLoading) loaded.value = true
      }
    )

    return {
      store,
      t,
      loaded,
      showCreate,
      groupByOptions,
      openCount,
      doneCount,
      upcomingCount,
      onSummarySelect,
      onComplete
    }

    // -- Function definitions --

    /** A summary cell sets the grouping and clears the category filter. */
    function onSummarySelect(grouping) {
      store.setGroupBy(grouping)
      store.setCategoryFilter(null)
    }

    /** Complete (toggle) a task; the store toasts + reloads on its own. */
    function onComplete(id) {
      store.completeTask(id).catch(() => {})
    }
  }
}
</script>

<style lang="scss" scoped>
.tasks-view {
  &__status {
    @apply flex items-center gap-2 text-[13px] text-muted;

    &--error {
      @apply text-bad;
    }
  }

  &__meta-line {
    @apply block leading-relaxed;
  }

  &__controls {
    @apply mb-3.5 flex flex-wrap items-center gap-3;
  }

  &__ctl-label {
    @apply font-mono text-[10px] uppercase tracking-[0.12em] text-muted;
  }

  &__spacer {
    @apply flex-1;
  }

  &__empty {
    @apply mt-2 items-center py-10 text-center;

    &-title {
      @apply font-serif text-[24px] italic text-ink;
    }

    &-body {
      @apply text-[14px] text-muted;
    }
  }

  &__footer {
    @apply mt-7 text-center text-[13px] text-muted;
  }
}
</style>
