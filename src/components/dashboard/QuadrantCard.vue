<template>
  <GlassCard class="quadrant-card">
    <!-- Gradient top accent bar -->
    <div
      class="quadrant-card__accent surface-accent"
      :style="{ '--accent-color': config.color }"
    />

    <!-- Header: label + task count -->
    <div class="quadrant-card__header">
      <div class="quadrant-card__title-group">
        <h3 class="quadrant-card__title">{{ config.label }}</h3>
        <p class="quadrant-card__desc">{{ config.desc }}</p>
      </div>

      <span
        class="quadrant-card__count"
        :style="{ color: config.color, backgroundColor: config.color + '22' }"
      >
        {{ tasks.length }}
      </span>
    </div>

    <!-- Task list -->
    <ul v-if="tasks.length > 0" class="quadrant-card__list">
      <li
        v-for="task in tasks"
        :key="task.id"
        class="quadrant-card__item"
        @click="handleSelectTask(task.id)"
      >
        <!-- Checkbox for quick completion -->
        <button
          class="quadrant-card__checkbox"
          :aria-label="t('tasks.complete')"
          @click.stop="handleCompleteTask(task.id)"
        >
          <CheckIcon class="quadrant-card__check-icon" />
        </button>

        <!-- Task info -->
        <div class="quadrant-card__item-body">
          <p class="quadrant-card__item-title">{{ task.title }}</p>

          <div class="quadrant-card__item-meta">
            <!-- Due date -->
            <span v-if="task.dueDate" class="quadrant-card__due" :class="dueDateClass(task)">
              <ClockIcon class="quadrant-card__meta-icon" />
              {{ formatDue(task.dueDate) }}
            </span>

            <!-- Effort badge -->
            <span v-if="task.effort" class="quadrant-card__effort">
              {{ task.effort }}m
            </span>
          </div>
        </div>

        <!-- Chevron -->
        <ChevronRightIcon class="quadrant-card__chevron" />
      </li>
    </ul>

    <!-- Empty state -->
    <div v-else class="quadrant-card__empty">
      <p class="quadrant-card__empty-text">{{ t('tasks.noTasks') }}</p>
    </div>
  </GlassCard>
</template>

<script>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CheckIcon, ClockIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { QUADRANT_CONFIG } from '@/utils/quadrantColors'
import GlassCard from '@/components/common/GlassCard.vue'

export default {
  name: 'QuadrantCard',
  components: { GlassCard, CheckIcon, ClockIcon, ChevronRightIcon },
  props: {
    /** Quadrant key: 'do' | 'schedule' | 'delegate' | 'drop' */
    quadrant: {
      type: String,
      required: true,
      validator: (val) => ['do', 'schedule', 'delegate', 'drop'].includes(val),
    },
    /** Array of task objects for this quadrant */
    tasks: { type: Array, default: () => [] },
  },
  emits: ['select-task', 'complete-task'],
  setup(props, { emit }) {
    const { t } = useI18n()

    // ── Computed ──

    /** QUADRANT_CONFIG entry for the current quadrant */
    const config = computed(() => QUADRANT_CONFIG[props.quadrant])

    return {
      t,
      config,
      dueDateClass,
      formatDue,
      handleSelectTask,
      handleCompleteTask,
    }

    // ── Function definitions ──

    /**
     * Returns a CSS class string based on how close or overdue the due date is.
     * @param {Object} task - Task object with a dueDate string
     * @returns {string} Tailwind class string
     */
    function dueDateClass(task) {
      if (!task.dueDate) return ''
      const now = new Date()
      const due = new Date(task.dueDate)
      const diffMs = due - now
      const diffDays = diffMs / (1000 * 60 * 60 * 24)
      if (diffDays < 0) return 'quadrant-card__due--overdue'
      if (diffDays < 1) return 'quadrant-card__due--today'
      return ''
    }

    /**
     * Formats a due date as a relative human-readable string.
     * @param {string} dateStr - ISO date string
     * @returns {string} Relative label such as 'Today', 'Yesterday', or 'May 20'
     */
    function formatDue(dateStr) {
      if (!dateStr) return ''
      const due = new Date(dateStr)
      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate())
      const diffDays = Math.round((startOfDue - startOfToday) / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return 'Today'
      if (diffDays === -1) return 'Yesterday'
      if (diffDays === 1) return 'Tomorrow'
      if (diffDays < -1) return `${Math.abs(diffDays)}d ago`
      if (diffDays <= 7) return `In ${diffDays}d`
      return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }

    /**
     * Emit select-task with the clicked task id.
     * @param {string} id - Task id
     */
    function handleSelectTask(id) {
      emit('select-task', id)
    }

    /**
     * Emit complete-task to mark a task done.
     * @param {string} id - Task id
     */
    function handleCompleteTask(id) {
      emit('complete-task', id)
    }
  },
}
</script>

<style lang="scss" scoped>
// ── Local variables ──
$transition: 150ms ease;

// ── Block ──
.quadrant-card {
  @apply flex flex-col overflow-hidden relative;
  min-height: 200px;

  // ── Accent bar (height + gradient supplied by .surface-accent) ──
  &__accent {
    @apply w-full flex-shrink-0;
  }

  // ── Header ──
  &__header {
    @apply flex items-start justify-between px-4 pt-3 pb-2;
  }

  &__title-group {
    @apply flex flex-col gap-0.5;
  }

  &__title {
    @apply text-sm font-semibold text-white m-0 leading-tight;
  }

  &__desc {
    @apply text-xs text-secondary-400 m-0;
  }

  &__count {
    @apply flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full;
    @apply text-sm font-bold font-mono leading-none;
  }

  // ── Task list ──
  &__list {
    @apply flex-1 overflow-y-auto list-none m-0 px-2 pb-2;
    max-height: 280px;
  }

  &__item {
    @apply flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer;
    @apply transition-colors duration-150;

    &:hover {
      @apply bg-white/5;

      .quadrant-card__chevron {
        @apply opacity-100;
      }
    }
  }

  // ── Checkbox ──
  &__checkbox {
    @apply flex-shrink-0 w-5 h-5 rounded-full border border-white/20 bg-transparent cursor-pointer;
    @apply flex items-center justify-center transition-all duration-150;

    &:hover {
      @apply border-white/50 bg-white/10;
    }
  }

  &__check-icon {
    @apply w-3 h-3 text-white opacity-0;

    .quadrant-card__checkbox:hover & {
      @apply opacity-60;
    }
  }

  // ── Item body ──
  &__item-body {
    @apply flex-1 min-w-0;
  }

  &__item-title {
    @apply text-sm text-secondary-100 truncate leading-snug m-0;
  }

  &__item-meta {
    @apply flex items-center gap-2 mt-0.5;
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

  // ── Chevron ──
  &__chevron {
    @apply w-3.5 h-3.5 text-secondary-500 flex-shrink-0 opacity-0 transition-opacity duration-150;
  }

  // ── Empty state ──
  &__empty {
    @apply flex-1 flex items-center justify-center px-4 pb-4;
  }

  &__empty-text {
    @apply text-xs text-secondary-600 italic m-0;
  }
}
</style>
