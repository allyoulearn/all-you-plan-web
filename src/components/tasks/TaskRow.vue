<template>
  <li class="task-row" @click="handleSelect">
    <!-- Checkbox for quick completion -->
    <button
      class="task-row__checkbox"
      :aria-label="t('tasks.complete')"
      :class="{ 'task-row__checkbox--checked': checked }"
      @click.stop="handleComplete"
    >
      <CheckIcon v-if="checked" class="task-row__check-icon task-row__check-icon--bounce" />
      <CheckIcon v-else class="task-row__check-icon" />
    </button>

    <!-- Task body -->
    <div class="task-row__body">
      <p class="task-row__title" :class="{ 'task-row__title--checked': checked }">
        {{ task.title }}
      </p>

      <div class="task-row__meta">
        <!-- Quadrant badge -->
        <QuadrantBadge v-if="task.quadrant" :quadrant="task.quadrant" />

        <!-- Due date -->
        <span
          v-if="task.dueDate"
          class="task-row__due"
          :class="dueDateClass"
        >
          <ClockIcon class="task-row__meta-icon" />
          {{ formattedDue }}
        </span>

        <!-- Effort badge -->
        <span v-if="task.effort" class="task-row__effort">
          {{ task.effort }}m
        </span>

        <!-- Subtask progress -->
        <span
          v-if="subtaskProgress !== null"
          class="task-row__subtasks"
        >
          {{ subtaskProgress }}
        </span>
      </div>
    </div>

    <!-- Chevron -->
    <ChevronRightIcon class="task-row__chevron" />
  </li>
</template>

<script>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CheckIcon, ClockIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import QuadrantBadge from '@/components/common/QuadrantBadge.vue'

export default {
  name: 'TaskRow',
  components: { CheckIcon, ClockIcon, ChevronRightIcon, QuadrantBadge },
  props: {
    /** Task object */
    task: {
      type: Object,
      required: true,
    },
  },
  emits: ['select', 'complete'],
  setup(props, { emit }) {
    const { t } = useI18n()

    // ── State ──

    /** Tracks the optimistic checked state for the bounce animation */
    const checked = ref(false)

    // ── Computed ──

    /**
     * Returns relative due date label including overdue indicator.
     * @returns {string}
     */
    const formattedDue = computed(() => {
      if (!props.task.dueDate) return ''
      const due = new Date(props.task.dueDate)
      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate())
      const diffDays = Math.round((startOfDue - startOfToday) / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Tomorrow'
      if (diffDays === -1) return 'Yesterday'
      if (diffDays < -1) return `${Math.abs(diffDays)}d overdue`
      if (diffDays <= 7) return `In ${diffDays}d`
      return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    })

    /**
     * Returns CSS modifier class for the due date label.
     * @returns {string}
     */
    const dueDateClass = computed(() => {
      if (!props.task.dueDate) return ''
      const due = new Date(props.task.dueDate)
      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate())
      const diffDays = Math.round((startOfDue - startOfToday) / (1000 * 60 * 60 * 24))

      if (diffDays < 0) return 'task-row__due--overdue'
      if (diffDays === 0) return 'task-row__due--today'
      return ''
    })

    /**
     * Returns "done/total" string if task has subtasks, null otherwise.
     * @returns {string|null}
     */
    const subtaskProgress = computed(() => {
      const subtasks = props.task.subtasks
      if (!subtasks || subtasks.length === 0) return null
      const done = subtasks.filter(s => s.completed).length
      return `${done}/${subtasks.length}`
    })

    // ── Handlers ──

    /**
     * Emit select event with the full task object.
     */
    function handleSelect() {
      emit('select', props.task)
    }

    /**
     * Optimistically set checked, trigger bounce animation, then emit complete.
     */
    function handleComplete() {
      checked.value = true
      setTimeout(() => {
        emit('complete', props.task.id)
      }, 300)
    }

    return {
      t,
      checked,
      formattedDue,
      dueDateClass,
      subtaskProgress,
      handleSelect,
      handleComplete,
    }
  },
}
</script>

<style lang="scss" scoped>
// ── Block ──
.task-row {
  @apply flex items-center gap-3 px-3 py-2.5 cursor-pointer;
  @apply border-b border-white/5 transition-colors duration-150;
  @apply list-none;

  &:last-child {
    @apply border-b-0;
  }

  &:hover {
    @apply bg-white/5;

    .task-row__chevron {
      @apply opacity-100;
    }
  }

  // ── Checkbox ──
  &__checkbox {
    @apply flex-shrink-0 w-5 h-5 rounded-full border border-white/20 bg-transparent cursor-pointer;
    @apply flex items-center justify-center transition-all duration-150;

    &:hover {
      @apply border-white/50 bg-white/10;
    }

    &--checked {
      @apply border-primary-400 bg-primary-500/20;
    }
  }

  &__check-icon {
    @apply w-3 h-3 text-white opacity-0;

    .task-row__checkbox:hover & {
      @apply opacity-60;
    }

    .task-row__checkbox--checked & {
      @apply opacity-100;
    }

    &--bounce {
      animation: checkBounce 0.4s ease-out;
    }
  }

  // ── Body ──
  &__body {
    @apply flex-1 min-w-0;
  }

  &__title {
    @apply text-sm text-secondary-100 truncate leading-snug m-0;

    &--checked {
      @apply line-through text-secondary-500;
    }
  }

  &__meta {
    @apply flex items-center gap-2 mt-0.5 flex-wrap;
  }

  // ── Due date ──
  &__due {
    @apply flex items-center gap-1 text-xs text-secondary-500;

    &--today {
      @apply text-primary-400;
    }

    &--overdue {
      @apply text-danger;
    }
  }

  &__meta-icon {
    @apply w-3 h-3 flex-shrink-0;
  }

  // ── Effort badge ──
  &__effort {
    @apply text-xs px-1.5 py-px rounded-full font-medium;
    @apply bg-secondary-700 text-secondary-300;
  }

  // ── Subtask progress ──
  &__subtasks {
    @apply text-xs text-secondary-500 font-mono;
  }

  // ── Chevron ──
  &__chevron {
    @apply w-3.5 h-3.5 text-secondary-500 flex-shrink-0 opacity-0 transition-opacity duration-150;
  }
}

// ── Bounce keyframes (mirrors tailwind config) ──
@keyframes checkBounce {
  0%   { transform: scale(0); }
  50%  { transform: scale(1.2); }
  100% { transform: scale(1); }
}
</style>
