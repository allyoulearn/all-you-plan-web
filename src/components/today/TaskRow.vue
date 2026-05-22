<template>
  <div class="task-row">
    <Checkbox :model-value="task.done" @update:model-value="$emit('complete', task.id)" />

    <span v-if="task.scheduledTime" class="task-row__time">
      {{ task.scheduledTime }}
    </span>

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

    <Pill v-if="task.tag" variant="default">
      {{ task.tag }}
    </Pill>
  </div>
</template>

<script>
/** TaskRow — single task entry with completion checkbox, scheduled time, title, note, and tag. */
import Checkbox from '@/components/ui/Checkbox.vue'
import Pill from '@/components/ui/Pill.vue'

export default {
  name: 'TaskRow',
  components: { Checkbox, Pill },
  props: {
    /** The task object to display */
    task: { type: Object, required: true }
  },
  emits: ['complete']
}
</script>

<style lang="scss" scoped>
.task-row {
  @apply flex items-center gap-3.5 rounded-lg px-2 py-3 transition-colors hover:bg-paper-3;

  &__time {
    @apply font-mono text-[11px] tracking-wide text-muted;
  }

  &__body {
    @apply min-w-0 flex-1;
  }

  &__title {
    @apply block text-[14px];

    &--done {
      @apply text-muted line-through;
    }

    &--pending {
      @apply text-ink;
    }
  }

  &__note {
    @apply mt-0.5 block font-mono text-[11px] text-muted;
  }
}
</style>
