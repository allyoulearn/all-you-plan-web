<template>
  <div class="stats-row">
    <!-- Overdue -->
    <StatCard :label="t('tasks.overdue')" tone="danger">
      <template #visual>
        <span
          class="stats-row__dot"
          :class="{ 'stats-row__dot--pulsing': overdueCount > 0 }"
        />
      </template>
      {{ overdueCount }}
    </StatCard>

    <!-- Due today -->
    <StatCard :label="t('briefing.dueToday')">
      <template #visual>
        <CalendarIcon class="stats-row__icon" />
      </template>
      {{ dueTodayCount }}
    </StatCard>

    <!-- Streak -->
    <StatCard :label="t('briefing.streak')">
      <template #visual>
        <ProgressRing :value="streakPercent" :size="40" :stroke="4" color="#f9e54d">
          <FireIcon class="stats-row__fire" />
        </ProgressRing>
      </template>
      {{ streakCurrent }}
    </StatCard>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CalendarIcon, FireIcon } from '@heroicons/vue/24/outline'
import StatCard from '@/components/dashboard/StatCard.vue'
import ProgressRing from '@/components/common/ProgressRing.vue'

export default {
  name: 'StatsRow',
  components: { StatCard, ProgressRing, CalendarIcon, FireIcon },
  props: {
    /** Today's briefing object, or null if not yet generated. */
    briefing: { type: Object, default: null },
  },
  setup(props) {
    const { t } = useI18n()

    const overdueCount = computed(() => props.briefing?.overdueTasks?.length ?? 0)
    const dueTodayCount = computed(() => props.briefing?.dueTodayTasks?.length ?? 0)
    const streakCurrent = computed(() => props.briefing?.streak?.current ?? 0)

    /**
     * Streak ring fill: progress of the current streak toward the personal
     * best. Falls back to a 7-day target when there is no best yet.
     */
    const streakPercent = computed(() => {
      const current = streakCurrent.value
      const best = props.briefing?.streak?.best ?? 0
      if (current <= 0) return 0
      const target = best > 0 ? best : 7
      return Math.min(100, (current / target) * 100)
    })

    return {
      t,
      overdueCount,
      dueTodayCount,
      streakCurrent,
      streakPercent,
    }
  },
}
</script>

<style lang="scss" scoped>
.stats-row {
  @apply grid gap-3;
  grid-template-columns: repeat(3, 1fr);

  @media (max-width: 639px) {
    grid-template-columns: 1fr;
  }

  &__dot {
    @apply w-3 h-3 rounded-full;
    background: theme('colors.danger.DEFAULT');

    &--pulsing {
      animation: pulse 1.8s ease-in-out infinite;
    }
  }

  &__icon {
    @apply w-6 h-6 text-primary-400;
  }

  &__fire {
    @apply w-4 h-4 text-q-delegate;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.5; transform: scale(0.85); }
}
</style>
