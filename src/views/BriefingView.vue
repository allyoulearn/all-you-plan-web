<template>
  <div class="briefing-view">

    <!-- Page header -->
    <div class="briefing-view__header">
      <h1 class="briefing-view__title">{{ t('briefing.title') }}</h1>
      <button
        class="briefing-view__refresh"
        :disabled="briefingsStore.loading"
        @click="handleGenerate"
      >
        <ArrowPathIcon class="briefing-view__refresh-icon" :class="{ 'briefing-view__refresh-icon--spin': briefingsStore.loading }" />
        {{ t('briefing.generate') }}
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="briefingsStore.loading" class="briefing-view__loading">
      <span class="briefing-view__spinner" />
      <span class="briefing-view__loading-text">{{ t('common.loading') }}</span>
    </div>

    <!-- No briefing: CTA -->
    <div v-else-if="!briefingsStore.todayBriefing" class="briefing-view__empty">
      <SparklesIcon class="briefing-view__empty-icon" />
      <p class="briefing-view__empty-heading">Generate your daily briefing</p>
      <p class="briefing-view__empty-sub">Get an AI-powered overview of your tasks, priorities, and focus order for today.</p>
      <button class="briefing-view__generate-btn" @click="handleGenerate">
        <SparklesIcon class="briefing-view__generate-icon" />
        Generate briefing
      </button>
    </div>

    <!-- Briefing content -->
    <template v-else>
      <!-- Greeting -->
      <p class="briefing-view__greeting">{{ briefingsStore.todayBriefing.greeting }}</p>

      <!-- Nudge message -->
      <p v-if="briefingsStore.todayBriefing.nudge" class="briefing-view__nudge">
        {{ briefingsStore.todayBriefing.nudge }}
      </p>

      <!-- Streak -->
      <GlassCard class="briefing-view__streak-card">
        <div class="briefing-view__streak-inner">
          <div class="briefing-view__streak-block">
            <span class="briefing-view__streak-label">Current streak</span>
            <span class="briefing-view__streak-value">
              <span class="briefing-view__streak-fire" aria-hidden="true">|</span>
              {{ briefingsStore.todayBriefing.currentStreak || 0 }}d
            </span>
          </div>
          <div class="briefing-view__streak-block">
            <span class="briefing-view__streak-label">Best streak</span>
            <span class="briefing-view__streak-value">{{ briefingsStore.todayBriefing.bestStreak || 0 }}d</span>
          </div>
        </div>
      </GlassCard>

      <!-- Overdue tasks -->
      <GlassCard
        v-if="briefingsStore.todayBriefing.overdueTasks && briefingsStore.todayBriefing.overdueTasks.length > 0"
        class="briefing-view__section briefing-view__section--overdue"
      >
        <h2 class="briefing-view__section-title">
          <ExclamationCircleIcon class="briefing-view__section-icon" />
          {{ t('briefing.overdue') }}
        </h2>
        <ul class="briefing-view__task-list">
          <li
            v-for="task in briefingsStore.todayBriefing.overdueTasks"
            :key="task.id"
            class="briefing-view__task-item"
          >
            <span class="briefing-view__task-title">{{ task.title }}</span>
            <span v-if="task.dueDate" class="briefing-view__task-due briefing-view__task-due--overdue">
              {{ formatDate(task.dueDate) }}
            </span>
          </li>
        </ul>
      </GlassCard>

      <!-- Due today tasks -->
      <GlassCard
        v-if="briefingsStore.todayBriefing.dueTodayTasks && briefingsStore.todayBriefing.dueTodayTasks.length > 0"
        class="briefing-view__section briefing-view__section--due-today"
      >
        <h2 class="briefing-view__section-title">
          <CalendarDaysIcon class="briefing-view__section-icon" />
          {{ t('briefing.dueToday') }}
        </h2>
        <ul class="briefing-view__task-list">
          <li
            v-for="task in briefingsStore.todayBriefing.dueTodayTasks"
            :key="task.id"
            class="briefing-view__task-item"
          >
            <span class="briefing-view__task-title">{{ task.title }}</span>
            <span v-if="task.dueDate" class="briefing-view__task-due">
              {{ formatDate(task.dueDate) }}
            </span>
          </li>
        </ul>
      </GlassCard>

      <!-- Suggested focus order -->
      <GlassCard
        v-if="briefingsStore.todayBriefing.suggestedFocusOrder && briefingsStore.todayBriefing.suggestedFocusOrder.length > 0"
        class="briefing-view__section"
      >
        <h2 class="briefing-view__section-title">
          <BoltIcon class="briefing-view__section-icon" />
          {{ t('briefing.focusOrder') }}
        </h2>
        <ol class="briefing-view__focus-list">
          <li
            v-for="(task, index) in briefingsStore.todayBriefing.suggestedFocusOrder"
            :key="task.id"
            class="briefing-view__focus-item"
          >
            <span class="briefing-view__focus-num">{{ index + 1 }}</span>
            <span class="briefing-view__focus-title">{{ task.title }}</span>
            <QuadrantBadge v-if="task.quadrant" :quadrant="task.quadrant" />
          </li>
        </ol>
      </GlassCard>

      <!-- Quadrant shift suggestions -->
      <GlassCard
        v-if="briefingsStore.todayBriefing.quadrantShifts && briefingsStore.todayBriefing.quadrantShifts.length > 0"
        class="briefing-view__section"
      >
        <h2 class="briefing-view__section-title">
          <ArrowsRightLeftIcon class="briefing-view__section-icon" />
          {{ t('briefing.shifts') }}
        </h2>
        <div class="briefing-view__shifts">
          <div
            v-for="shift in briefingsStore.todayBriefing.quadrantShifts"
            :key="shift.taskId"
            class="briefing-view__shift-card"
          >
            <p class="briefing-view__shift-task">{{ shift.taskTitle }}</p>
            <div class="briefing-view__shift-row">
              <QuadrantBadge :quadrant="shift.fromQuadrant" />
              <ArrowRightIcon class="briefing-view__shift-arrow" />
              <QuadrantBadge :quadrant="shift.toQuadrant" />
            </div>
            <p v-if="shift.reason" class="briefing-view__shift-reason">{{ shift.reason }}</p>
          </div>
        </div>
      </GlassCard>
    </template>
  </div>
</template>

<script>
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  SparklesIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  CalendarDaysIcon,
  BoltIcon,
  ArrowsRightLeftIcon,
  ArrowRightIcon,
} from '@heroicons/vue/24/outline'
import { useBriefingsStore } from '@/stores/briefings.store'
import GlassCard from '@/components/common/GlassCard.vue'
import QuadrantBadge from '@/components/common/QuadrantBadge.vue'

export default {
  name: 'BriefingView',
  components: {
    SparklesIcon,
    ArrowPathIcon,
    ExclamationCircleIcon,
    CalendarDaysIcon,
    BoltIcon,
    ArrowsRightLeftIcon,
    ArrowRightIcon,
    GlassCard,
    QuadrantBadge,
  },
  setup() {
    const { t } = useI18n()
    const briefingsStore = useBriefingsStore()

    // ── Lifecycle ──

    onMounted(() => {
      briefingsStore.fetchTodayBriefing()
    })

    // ── Helpers ──

    /**
     * Format an ISO date string to a short locale date.
     * @param {string} iso
     * @returns {string}
     */
    function formatDate(iso) {
      if (!iso) return ''
      return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }

    // ── Handlers ──

    /** Trigger a new briefing generation via the store. */
    async function handleGenerate() {
      await briefingsStore.generateBriefing()
    }

    return {
      t,
      briefingsStore,
      formatDate,
      handleGenerate,
    }
  },
}
</script>

<style lang="scss" scoped>
// ── Block ──
.briefing-view {
  @apply flex flex-col gap-5 p-4;

  // ── Header ──
  &__header {
    @apply flex items-center justify-between gap-4;
  }

  &__title {
    @apply text-xl font-bold text-primary-400 m-0;
  }

  &__refresh {
    @apply flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-medium cursor-pointer;
    @apply border border-white/10 bg-white/5 text-secondary-300;
    @apply transition-all duration-150;

    &:hover:not(:disabled) {
      @apply bg-white/10 text-secondary-100;
    }

    &:disabled {
      @apply opacity-50 cursor-not-allowed;
    }
  }

  &__refresh-icon {
    @apply w-3.5 h-3.5;

    &--spin {
      animation: spin 0.8s linear infinite;
    }
  }

  // ── Loading ──
  &__loading {
    @apply flex flex-col items-center justify-center gap-3 py-20 text-secondary-500;
  }

  &__spinner {
    @apply w-8 h-8 rounded-full border-2 border-white/10 border-t-primary-500 animate-spin;
    display: block;
  }

  &__loading-text {
    @apply text-sm;
  }

  // ── Empty / CTA ──
  &__empty {
    @apply flex flex-col items-center justify-center gap-4 py-20 text-center;
  }

  &__empty-icon {
    @apply w-12 h-12 text-primary-400 opacity-60;
  }

  &__empty-heading {
    @apply text-lg font-semibold text-secondary-100 m-0;
  }

  &__empty-sub {
    @apply text-sm text-secondary-500 max-w-xs m-0;
  }

  &__generate-btn {
    @apply flex items-center gap-2 px-5 py-2.5 rounded-btn text-sm font-semibold cursor-pointer;
    @apply bg-primary-500 text-white border-none;
    @apply transition-all duration-150;

    &:hover {
      @apply bg-primary-400;
    }
  }

  &__generate-icon {
    @apply w-4 h-4;
  }

  // ── Greeting ──
  &__greeting {
    @apply text-xl font-semibold text-primary-300 m-0;
  }

  // ── Nudge ──
  &__nudge {
    @apply text-sm text-secondary-400 m-0 px-4 py-3;
    @apply border border-white/10 rounded-glass bg-white/3;
    @apply italic;
  }

  // ── Streak card ──
  &__streak-card {
    @apply px-5 py-4;
  }

  &__streak-inner {
    @apply flex items-center gap-8;
  }

  &__streak-block {
    @apply flex flex-col gap-0.5;
  }

  &__streak-label {
    @apply text-xs text-secondary-500 uppercase tracking-wider;
  }

  &__streak-value {
    @apply text-2xl font-bold text-secondary-100 flex items-center gap-1.5;
  }

  &__streak-fire {
    // Vertical bar as placeholder — no emoji allowed.
    @apply text-primary-400 font-black;
  }

  // ── Sections ──
  &__section {
    @apply px-5 py-4 flex flex-col gap-3;

    &--overdue {
      border-color: rgba(239, 68, 68, 0.4);
    }

    &--due-today {
      border-color: rgba(62, 196, 196, 0.4);
    }
  }

  &__section-title {
    @apply flex items-center gap-2 text-sm font-semibold text-secondary-200 m-0 uppercase tracking-wider;
  }

  &__section-icon {
    @apply w-4 h-4;

    .briefing-view__section--overdue & {
      @apply text-red-400;
    }

    .briefing-view__section--due-today & {
      @apply text-primary-400;
    }
  }

  // ── Task list ──
  &__task-list {
    @apply flex flex-col gap-2 list-none m-0 p-0;
  }

  &__task-item {
    @apply flex items-center justify-between gap-3;
  }

  &__task-title {
    @apply text-sm text-secondary-200 flex-1 min-w-0 truncate;
  }

  &__task-due {
    @apply text-xs text-secondary-500 flex-shrink-0;

    &--overdue {
      @apply text-red-400;
    }
  }

  // ── Focus order list ──
  &__focus-list {
    @apply flex flex-col gap-2.5 list-none m-0 p-0;
  }

  &__focus-item {
    @apply flex items-center gap-3;
  }

  &__focus-num {
    @apply w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0;
    @apply bg-primary-500/20 text-primary-400 border border-primary-500/30;
  }

  &__focus-title {
    @apply text-sm text-secondary-200 flex-1 min-w-0 truncate;
  }

  // ── Shift suggestions ──
  &__shifts {
    @apply flex flex-col gap-3;
  }

  &__shift-card {
    @apply flex flex-col gap-2 px-3 py-3 rounded-glass;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  &__shift-task {
    @apply text-sm font-medium text-secondary-200 m-0;
  }

  &__shift-row {
    @apply flex items-center gap-2;
  }

  &__shift-arrow {
    @apply w-3.5 h-3.5 text-secondary-500 flex-shrink-0;
  }

  &__shift-reason {
    @apply text-xs text-secondary-500 m-0 italic;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
</style>
