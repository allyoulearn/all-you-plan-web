<template>
  <div class="dashboard-view">
    <!-- Page heading -->
    <h1 class="dashboard-view__title">{{ t('dashboard.title') }}</h1>

    <!-- Stats row -->
    <StatsRow :briefing="briefingsStore.todayBriefing" />

    <!-- Briefing banner -->
    <BriefingBanner
      class="dashboard-view__briefing"
      :briefing="briefingsStore.todayBriefing"
      @generate="handleGenerate"
    />

    <!-- Loading state -->
    <div v-if="tasksStore.loading" class="dashboard-view__loading">
      <span class="dashboard-view__spinner" />
      <span class="dashboard-view__loading-text">{{ t('common.loading') }}</span>
    </div>

    <!-- Eisenhower matrix -->
    <EisenhowerMatrix
      v-else
      class="dashboard-view__matrix"
      :matrix="tasksStore.matrix"
      @select-task="handleSelectTask"
      @complete-task="handleCompleteTask"
    />
  </div>
</template>

<script>
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTasksStore } from '@/stores/tasks.store'
import { useBriefingsStore } from '@/stores/briefings.store'
import BriefingBanner from '@/components/dashboard/BriefingBanner.vue'
import EisenhowerMatrix from '@/components/dashboard/EisenhowerMatrix.vue'
import StatsRow from '@/components/dashboard/StatsRow.vue'

export default {
  name: 'DashboardView',
  components: { BriefingBanner, EisenhowerMatrix, StatsRow },
  setup() {
    const { t } = useI18n()
    const tasksStore = useTasksStore()
    const briefingsStore = useBriefingsStore()

    // ── Lifecycle ──
    onMounted(() => {
      tasksStore.fetchMatrix()
      briefingsStore.fetchTodayBriefing()
    })

    return {
      t,
      tasksStore,
      briefingsStore,
      handleSelectTask,
      handleCompleteTask,
      handleGenerate,
    }

    // ── Function definitions ──

    /**
     * Handle task selection from the matrix. Task slide-over arrives in Task 8.
     * @param {string} id - Task id
     */
    function handleSelectTask(id) {
      // Slide-over implementation arrives in Task 8
      console.warn('[DashboardView] select-task:', id)
    }

    /**
     * Mark a task complete then re-fetch the matrix so the quadrant updates.
     * @param {string} id - Task id
     */
    async function handleCompleteTask(id) {
      await tasksStore.completeTask(id)
      await tasksStore.fetchMatrix()
    }

    /** Trigger briefing generation and let the store update todayBriefing. */
    async function handleGenerate() {
      await briefingsStore.generateBriefing()
    }
  },
}
</script>

<style lang="scss" scoped>
// ── Block ──
.dashboard-view {
  @apply flex flex-col gap-4 p-4;

  // ── Title ──
  &__title {
    @apply text-2xl font-semibold text-white m-0;
  }

  // ── Briefing banner ──
  &__briefing {
    // Spacing already provided by parent gap
  }

  // ── Loading state ──
  &__loading {
    @apply flex flex-col items-center justify-center gap-3 py-16 text-secondary-500;
  }

  &__spinner {
    @apply w-8 h-8 rounded-full border-2 border-white/10 border-t-primary-500 animate-spin;
    display: block;
  }

  &__loading-text {
    @apply text-sm;
  }

  // ── Matrix ──
  &__matrix {
    // Fills remaining space
  }
}
</style>
