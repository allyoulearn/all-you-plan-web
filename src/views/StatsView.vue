<template>
  <div>
    <ScreenHeading
      eyebrow="Looking back · Stats"
      title="Six months of"
      emphasis="showing up."
    />

    <div v-if="store.loading" class="stats-view__status">
      {{ t('common.loading') }}
    </div>

    <div v-else-if="store.error" class="stats-view__status stats-view__status--error">
      {{ store.error }}
    </div>

    <template v-else-if="store.stats">
      <!-- KPI strip -->
      <div class="stats-view__kpi-strip">
        <KpiTile :label="t('stats.kpiStreak')" :value="topStreak" :unit="t('stats.unitDays')" />

        <KpiTile :label="t('stats.kpiBest')" :value="topBest" :unit="t('stats.unitDays')" />

        <KpiTile :label="t('stats.kpiHabits')" :value="store.stats.rankedHabits.length" :unit="t('stats.unitTracked')" />
      </div>

      <!-- Activity grid -->
      <SectionHeader :label="t('stats.activityGrid')" />

      <Card>
        <Heatmap :values="heatmapValues" />
      </Card>

      <!-- Habits ranked -->
      <SectionHeader :label="t('stats.habitsRanked')" :count="store.stats.rankedHabits.length" />

      <div v-if="store.stats.rankedHabits.length === 0" class="stats-view__status">
        {{ t('stats.noHabits') }}
      </div>

      <div v-else class="stats-view__habits-list">
        <div
          v-for="(habit, idx) in store.stats.rankedHabits"
          :key="habit.choreId"
          class="stats-view__habit-row"
        >
          <span class="stats-view__habit-rank">
            {{ String(idx + 1).padStart(2, '0') }}
          </span>

          <div class="stats-view__habit-meta">
            <span class="stats-view__habit-name">
              {{ habit.name }}
            </span>

            <span class="stats-view__habit-sub">
              {{ t('stats.habitSub', { streak: habit.streak, best: habit.bestStreak }) }}
            </span>
          </div>

          <span class="stats-view__habit-streak">
            {{ habit.streak }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
/** StatsView — six-month activity heatmap and ranked habits list with KPI summary tiles. */
import { onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStatsStore } from '@/stores/stats.store.js'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Card from '@/components/ui/Card.vue'
import KpiTile from '@/components/today/KpiTile.vue'
import Heatmap from '@/components/stats/Heatmap.vue'

export default {
  name: 'StatsView',
  components: { ScreenHeading, SectionHeader, Card, KpiTile, Heatmap },
  setup() {
    // -- State --
    const store = useStatsStore()
    const { t } = useI18n()

    // -- Computed --

    /** Heatmap intensity values for the past 26 weeks (182 cells). */
    const heatmapValues = computed(() => store.stats?.heatmap ?? Array(182).fill(0))

    /** Highest current streak across all ranked habits. */
    const topStreak = computed(() => {
      const habits = store.stats?.rankedHabits ?? []
      return habits.reduce((max, h) => Math.max(max, h.streak), 0)
    })

    /** Highest best streak across all ranked habits. */
    const topBest = computed(() => {
      const habits = store.stats?.rankedHabits ?? []
      return habits.reduce((max, h) => Math.max(max, h.bestStreak), 0)
    })

    // -- Lifecycle --
    onMounted(() => store.load())

    return { t, store, heatmapValues, topStreak, topBest }
  }
}
</script>

<style lang="scss" scoped>
.stats-view {
  &__status {
    @apply text-[13px] text-muted;

    &--error {
      @apply text-bad;
    }
  }

  &__kpi-strip {
    @apply mb-7 grid grid-cols-3 gap-3.5;
  }

  &__habits-list {
    @apply rounded-md bg-paper-2 px-2.5 py-1 shadow-sm;
  }

  &__habit-row {
    @apply flex items-center gap-4 border-b border-rule-soft py-3.5 last:border-0;
  }

  &__habit-rank {
    @apply w-6 font-mono text-[12px] text-muted;
  }

  &__habit-meta {
    @apply flex flex-1 flex-col gap-0.5;
  }

  &__habit-name {
    @apply text-[14px] text-ink;
  }

  &__habit-sub {
    @apply text-[12px] text-muted;
  }

  &__habit-streak {
    @apply font-mono text-[20px] font-medium text-ink;
  }
}
</style>
