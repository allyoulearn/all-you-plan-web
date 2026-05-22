<template>
  <div class="kanban-card">
    <p
      class="kanban-card__title"
      :class="task.done ? 'kanban-card__title--done' : 'kanban-card__title--pending'"
    >
      {{ task.title }}
    </p>

    <div class="kanban-card__footer">
      <Checkbox
        :model-value="task.done"
        :size="18"
        @update:model-value="$emit('complete', task.id)"
      />

      <Pill v-if="task.tag" variant="default">
        {{ task.tag }}
      </Pill>
    </div>
  </div>
</template>

<script>
/** KanbanCard — compact task card for the Kanban board with completion checkbox and tag pill. */
import Pill from '@/components/ui/Pill.vue'
import Checkbox from '@/components/ui/Checkbox.vue'

export default {
  name: 'KanbanCard',
  components: { Pill, Checkbox },
  props: {
    /** The task object to display */
    task: { type: Object, required: true }
  },
  emits: ['complete']
}
</script>

<style lang="scss" scoped>
.kanban-card {
  @apply rounded-md bg-paper p-3 shadow-sm;

  &__title {
    @apply text-[13px] leading-snug;

    &--done {
      @apply text-muted line-through;
    }

    &--pending {
      @apply text-ink;
    }
  }

  &__footer {
    @apply mt-2.5 flex items-center gap-2;
  }
}
</style>
