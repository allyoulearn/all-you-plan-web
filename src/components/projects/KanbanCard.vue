<template>
  <!--
    The card is a focusable GROUP, not role="button": it holds its own
    interactive controls (the completion checkbox, the Wren origin badge) and a
    role="button" container nesting those would fail axe's `nested-interactive`
    rule (interactive controls must not be nested). As a group it stays in the
    tab order (tabindex="0") for the keyboard-move shortcuts and the
    Enter/Space "open detail" affordance, while its children are announced as
    the legitimately-nested controls they are. The group is named by the task
    title so a screen reader landing on it knows which task it is.
  -->
  <div
    class="kanban-card"
    :data-task-id="task.id"
    role="group"
    tabindex="0"
    :aria-label="task.title"
    :aria-keyshortcuts="'Control+ArrowLeft Control+ArrowRight Control+ArrowUp Control+ArrowDown Alt+ArrowUp Alt+ArrowDown'"
    :title="t('kanban.cardKeyboardHint')"
    @click="$emit('open', task)"
    @keydown.enter.prevent="$emit('open', task)"
    @keydown.space.prevent="$emit('open', task)"
    @keydown="onKeydown"
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
  emits: ['complete', 'open', 'move'],
  setup(props, { emit }) {
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

    return { t, subtaskProgress, subtaskAriaLabel, onKeydown }

    // -- Function definitions --

    /**
     * Keyboard move handler — the keyboard-operable alternative to the
     * pointer-only SortableJS drag. SortableJS has no keyboard path, so we
     * emit a semantic `move` event the board translates into the same store
     * mutations a drag would trigger:
     *   - Ctrl/Cmd + Left/Right  → move across columns
     *   - Ctrl/Cmd + Up/Down     → move across columns (vertical mental model)
     *   - Alt + Up/Down          → reorder within the current column
     * Enter/Space (open detail) are handled by their own dedicated listeners.
     */
    function onKeydown(e) {
      const horical = e.ctrlKey || e.metaKey
      const within = e.altKey && !horical

      let direction = null
      if (horical && e.key === 'ArrowLeft') direction = 'prev-column'
      else if (horical && e.key === 'ArrowRight') direction = 'next-column'
      else if (horical && e.key === 'ArrowUp') direction = 'prev-column'
      else if (horical && e.key === 'ArrowDown') direction = 'next-column'
      else if (within && e.key === 'ArrowUp') direction = 'up'
      else if (within && e.key === 'ArrowDown') direction = 'down'

      if (!direction) return
      e.preventDefault()
      emit('move', { taskId: props.task.id, direction })
    }
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
