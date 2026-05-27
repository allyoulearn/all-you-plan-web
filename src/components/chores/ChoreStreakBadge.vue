<template>
  <span class="chore-streak-badge" :aria-label="ariaLabel">
    <span class="chore-streak-badge__main">
      <AppIcon name="fire" :size="13" class="chore-streak-badge__icon" />
      <span class="chore-streak-badge__count">{{ streak }}</span>
    </span>
    <span v-if="showBest" class="chore-streak-badge__best">
      {{ t('chores.streakBest', { count: bestStreak }) }}
    </span>
  </span>
</template>

<script>
/** ChoreStreakBadge — flame icon + streak count, with an optional "best N" subline. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'

export default {
  name: 'ChoreStreakBadge',
  components: { AppIcon },
  props: {
    streak: { type: Number, required: true },
    bestStreak: { type: Number, default: 0 }
  },
  setup(props) {
    const { t } = useI18n()
    const showBest = computed(() => props.streak > 0 && props.streak < props.bestStreak)
    const ariaLabel = computed(() => t('chores.streakDays', { count: props.streak }))
    return { t, showBest, ariaLabel }
  }
}
</script>

<style lang="scss" scoped>
.chore-streak-badge {
  @apply flex flex-col items-end;

  &__main {
    @apply inline-flex items-center gap-1 font-mono text-[12px] text-ink;
  }

  &__icon {
    @apply text-ink;
  }

  &__count {
    @apply tabular-nums;
  }

  &__best {
    @apply mt-0.5 font-mono text-[10px] text-muted;
  }
}
</style>
