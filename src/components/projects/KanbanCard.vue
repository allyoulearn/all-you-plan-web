<template>
  <div
    class="kanban-card"
    role="button"
    tabindex="0"
    @click="$emit('open', task)"
    @keydown.enter.prevent="$emit('open', task)"
    @keydown.space.prevent="$emit('open', task)"
  >
    <!-- Title row -->
    <div class="kanban-card__head">
      <!-- Priority indicator -->
      <AppPriorityDot
        v-if="task.priority"
        :value="task.priority"
        :aria-label="task.priority"
      />

      <!-- Task title -->
      <p
        class="kanban-card__title"
        :class="task.done ? 'kanban-card__title--done' : 'kanban-card__title--pending'"
      >
        {{ task.title }}
      </p>

      <!-- Wren origin badge -->
      <WrenOriginBadge ref-type="task" :ref-id="task.id" />
    </div>

    <!-- Footer meta -->
    <div class="kanban-card__footer" @click.stop>
      <!-- Complete checkbox -->
      <AppCheckbox
        :model-value="task.done"
        :size="18"
        @update:model-value="$emit('complete', task.id)"
      />

      <!-- Tag pill -->
      <AppPill v-if="task.tag" variant="default">
        {{ task.tag }}
      </AppPill>

      <!-- Subtask progress -->
      <span
        v-if="task.subtasks?.length"
        class="kanban-card__subtask-count"
        :aria-label="subtaskAriaLabel"
      >
        <AppIcon name="check" :size="12" />

        {{ subtaskProgress }}
      </span>
    </div>
  </div>
</template>

<script>
/**
 * KanbanCard — compact task card. Click anywhere on the card body (outside
 * the checkbox) to open the task detail modal; the checkbox in the footer
 * toggles `done` in place without opening the modal. Implemented as a
 * focusable div rather than a `<button>` to avoid nesting an input control
 * inside a button (invalid HTML).
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppPill from '@/components/ui/AppPill.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppPriorityDot from '@/components/ui/AppPriorityDot.vue'
import WrenOriginBadge from '@/components/wren/WrenOriginBadge.vue'

export default {
  name: 'KanbanCard',
  components: { AppPill, AppCheckbox, AppIcon, AppPriorityDot, WrenOriginBadge },
  props: {
    /** The task object to display */
    task: { type: Object, required: true }
  },
  emits: ['complete', 'open'],
  setup(props) {
    // -- State --
    const { t } = useI18n()

    // -- Computed --
    /** Subtask progress as a "done/total" fraction shown in the card footer. */
    const subtaskProgress = computed(() => {
      const list = props.task.subtasks ?? []
      const done = list.filter(s => s.done).length
      return `${done}/${list.length}`
    })

    /** Verbose aria-label for the subtask counter (e.g. "2 of 5 subtasks complete"). */
    const subtaskAriaLabel = computed(() => {
      const list = props.task.subtasks ?? []
      const done = list.filter(s => s.done).length
      return t('kanban.subtaskAriaLabel', { done, total: list.length })
    })

    return { subtaskProgress, subtaskAriaLabel }
  }
}
</script>

<style lang="scss" scoped>
.kanban-card {
  @apply block w-full cursor-pointer rounded-md bg-paper p-3 text-left shadow-sm transition-colors hover:bg-paper-2;
  @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;

  &__head {
    @apply flex items-start gap-2;
  }

  &__title {
    @apply min-w-0 flex-1 text-[13px] leading-snug;

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

  &__subtask-count {
    @apply ml-auto inline-flex items-center gap-1 font-mono text-[11px] text-muted;
  }
}
</style>
