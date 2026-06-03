<template>
  <div class="task-row" :class="[`task-row--u-${task.urgency}`, { 'task-row--done': task.done }]">
    <!-- Left urgency stripe -->
    <span class="task-row__stripe" aria-hidden="true" />

    <!-- Completion checkbox (round) -->
    <AppCheckbox
      class="task-row__check"
      :model-value="task.done"
      :aria-label="t('tasksWorkspace.toggleDone')"
      @update:model-value="$emit('complete', task.id)"
    />

    <!-- Title + optional note -->
    <span class="task-row__body">
      <span
        class="task-row__title"
        :class="task.done ? 'task-row__title--done' : 'task-row__title--pending'"
      >
        {{ task.title }}
      </span>

      <span v-if="task.note" class="task-row__note">
        {{ task.note }}
      </span>
    </span>

    <!-- Meta: due badge, recurring tag, category tag, project link -->
    <span class="task-row__meta">
      <!-- Due badge (mono pill, tier color + flag/calendar icon) -->
      <span v-if="task.due" class="task-row__due" :class="dueClass">
        <AppIcon :name="isOverdue ? 'flag' : 'calendar'" :size="11" />
        {{ task.due.label }}
      </span>

      <!-- Recurring marker -->
      <AppPill v-if="task.kind === 'recurring'" variant="soft">
        {{ t('tasksWorkspace.recurring') }}
      </AppPill>

      <!-- Category tag -->
      <AppPill v-if="categoryLabel" variant="soft">
        {{ categoryLabel }}
      </AppPill>

      <!-- Project link -->
      <RouterLink
        v-if="task.project"
        class="task-row__project"
        :to="`/projects/${task.project.id}`"
      >
        <AppIcon name="projects" :size="10" />
        {{ projectShortName }}
      </RouterLink>
    </span>
  </div>
</template>

<script>
/**
 * TaskRow — one task in the workspace list.
 *
 * Renders a colored left urgency stripe (3px), a round completion checkbox,
 * the title plus an optional muted note, and a right-aligned meta cluster:
 * a mono due badge whose tier color reflects overdue/now/soon, a "recurring"
 * tag for recurring tasks, a soft category tag, and a project-link pill when
 * the task belongs to a project.
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import AppPill from '@/components/ui/AppPill.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { CATEGORY_LABELS } from '@/stores/tasks.store.js'

export default {
  name: 'TaskRow',
  components: { AppCheckbox, AppPill, AppIcon, RouterLink },
  props: {
    /** The task object to display. */
    task: { type: Object, required: true }
  },
  emits: ['complete'],
  setup(props) {
    const { t } = useI18n()

    /** True when the due date is in the past. */
    const isOverdue = computed(() => !!props.task.due && props.task.due.daysLeft < 0)

    /**
     * Tier class for the due badge — overdue (<0), now (≤1), soon (≤7), else
     * the neutral base. Mirrors the design's dueClass tiers.
     */
    const dueClass = computed(() => {
      const due = props.task.due
      if (!due) return ''
      if (due.daysLeft < 0) return 'task-row__due--over'
      if (due.daysLeft <= 1) return 'task-row__due--now'
      if (due.daysLeft <= 7) return 'task-row__due--soon'
      return ''
    })

    /** Human category label, or empty when the task has no category. */
    const categoryLabel = computed(() =>
      props.task.category ? (CATEGORY_LABELS[props.task.category] ?? props.task.category) : ''
    )

    /**
     * Trim the project name to its first segment so the pill stays compact
     * (drops trailing " — subtitle" and " (parenthetical)" the way the
     * design does).
     */
    const projectShortName = computed(() => {
      const name = props.task.project?.name ?? ''
      return name.split(' — ')[0].split(' (')[0]
    })

    return { t, isOverdue, dueClass, categoryLabel, projectShortName }
  }
}
</script>

<style lang="scss" scoped>
.task-row {
  @apply relative flex items-start gap-3 rounded-md py-3 pl-4 pr-2 transition-colors hover:bg-paper-3;

  &__stripe {
    @apply absolute bottom-2 left-0 top-2 w-[3px] rounded-pill;
    background: var(--rule-soft);
  }

  &--u-critical &__stripe {
    background: var(--u-critical);
  }

  &--u-high &__stripe {
    background: var(--u-high);
  }

  &--u-medium &__stripe {
    background: var(--u-medium);
  }

  &--u-low &__stripe {
    background: var(--u-low);
  }

  &__check {
    @apply mt-px shrink-0;
  }

  &__body {
    @apply min-w-0 flex-1;
  }

  &__title {
    @apply block text-[14.5px] font-medium;

    &--done {
      @apply text-muted line-through;
    }

    &--pending {
      @apply text-ink;
    }
  }

  &__note {
    @apply mt-[3px] block max-w-[60ch] text-[12.5px] leading-snug text-muted;
  }

  &__meta {
    @apply flex shrink-0 flex-wrap items-center justify-end gap-2 pt-px;
  }

  &__due {
    @apply inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 py-1 font-mono text-[11px] font-medium;
    background: var(--paper-3);
    color: var(--ink-2);

    &--over {
      background: var(--due-over-bg);
      color: var(--due-over-text);
    }

    &--now {
      background: var(--due-now-bg);
      color: var(--due-now-text);
    }

    &--soon {
      background: var(--due-soon-bg);
      color: var(--due-soon-text);
    }
  }

  &__project {
    @apply inline-flex items-center gap-1 rounded-pill border border-rule-soft px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:border-muted hover:text-ink;
  }
}
</style>
