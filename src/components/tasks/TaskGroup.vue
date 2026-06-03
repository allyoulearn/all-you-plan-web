<template>
  <div class="task-group">
    <!-- Group header: optional urgency dot, label, mono count, rule line -->
    <div class="task-group__header" :class="group.urgency ? `task-group__header--u-${group.urgency}` : ''">
      <span v-if="group.urgency" class="task-group__dot" aria-hidden="true" />

      <span class="task-group__label">
        {{ group.label }}
      </span>

      <span class="task-group__count">
        [{{ group.count }}]
      </span>

      <span class="task-group__rule" />
    </div>

    <!-- Task list -->
    <div class="task-group__list">
      <TaskRow
        v-for="task in group.tasks"
        :key="task.id"
        :task="task"
        @complete="$emit('complete', $event)"
      />
    </div>
  </div>
</template>

<script>
/**
 * TaskGroup — a labeled section of the workspace: a header (urgency dot when
 * grouping by urgency, the label, a mono count, and a divider rule) followed
 * by the group's TaskRow list. Forwards each row's `complete` upward.
 */
import TaskRow from './TaskRow.vue'

export default {
  name: 'TaskGroup',
  components: { TaskRow },
  props: {
    /** Group: { key, label, urgency?, count, tasks }. */
    group: { type: Object, required: true }
  },
  emits: ['complete']
}
</script>

<style lang="scss" scoped>
.task-group {
  &__header {
    @apply mb-2 mt-7 flex items-center gap-2.5;
  }

  &__dot {
    @apply h-[9px] w-[9px] shrink-0 rounded-pill;
    background: var(--rule-soft);
  }

  &__header--u-critical &__dot {
    background: var(--u-critical);
  }

  &__header--u-high &__dot {
    background: var(--u-high);
  }

  &__header--u-medium &__dot {
    background: var(--u-medium);
  }

  &__header--u-low &__dot {
    background: var(--u-low);
  }

  &__label {
    @apply text-[13px] font-medium text-ink;
  }

  &__count {
    @apply font-mono text-[11px] text-muted;
  }

  &__rule {
    @apply flex-1 border-t border-rule-soft;
  }
}
</style>
