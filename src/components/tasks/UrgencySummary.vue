<template>
  <div class="urgency-summary">
    <button
      v-for="cell in cells"
      :key="cell.key"
      type="button"
      class="urgency-summary__cell"
      :class="cell.tone ? `urgency-summary__cell--${cell.tone}` : ''"
      @click="$emit('select', cell.action)"
    >
      <span class="urgency-summary__count">
        {{ cell.count }}
      </span>

      <span class="urgency-summary__label">
        {{ cell.label }}
      </span>
    </button>
  </div>
</template>

<script>
/**
 * UrgencySummary — the four-cell strip above the task list.
 *
 * Cells: Critical (red), High (accent), Overdue (red), Upcoming deadlines
 * (count of dated tasks due within the next 7 days). Clicking Critical/High
 * jumps to the urgency grouping; clicking Overdue/Upcoming jumps to the due
 * grouping. The parent decides what `select` does with the emitted grouping.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export default {
  name: 'UrgencySummary',
  props: {
    /** TaskSummary block: { total, overdue, dated, critical, high, doneRecently }. */
    summary: { type: Object, default: null },
    /** Count of dated, not-yet-overdue tasks due within 7 days. */
    upcoming: { type: Number, default: 0 }
  },
  emits: ['select'],
  setup(props) {
    const { t } = useI18n()

    const cells = computed(() => {
      const s = props.summary ?? {}
      return [
        {
          key: 'critical',
          label: t('tasksWorkspace.critical'),
          count: s.critical ?? 0,
          tone: 'crit',
          action: 'urgency'
        },
        {
          key: 'high',
          label: t('tasksWorkspace.high'),
          count: s.high ?? 0,
          tone: 'high',
          action: 'urgency'
        },
        {
          key: 'overdue',
          label: t('tasksWorkspace.overdue'),
          count: s.overdue ?? 0,
          tone: 'over',
          action: 'due'
        },
        {
          key: 'upcoming',
          label: t('tasksWorkspace.upcomingDeadlines'),
          count: props.upcoming,
          tone: null,
          action: 'due'
        }
      ]
    })

    return { t, cells }
  }
}
</script>

<style lang="scss" scoped>
.urgency-summary {
  @apply mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4;

  &__cell {
    @apply relative flex flex-col gap-0.5 overflow-hidden rounded-md border border-rule-soft bg-paper-2 px-[18px] py-4 text-left transition-all hover:-translate-y-px hover:border-muted;
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;

    // Left accent rail — neutral by default, urgency-colored on crit/high/over.
    &::before {
      content: '';
      @apply absolute bottom-0 left-0 top-0 w-1;
      background: var(--rule-soft);
    }

    &--crit::before,
    &--over::before {
      background: var(--u-critical);
    }

    &--high::before {
      background: var(--u-high);
    }
  }

  &__count {
    @apply font-serif text-[38px] leading-none tracking-[-0.02em] text-ink;
  }

  &__cell--crit &__count,
  &__cell--over &__count {
    color: var(--u-critical);
  }

  &__label {
    @apply text-[12px] font-medium text-muted;
  }
}
</style>
