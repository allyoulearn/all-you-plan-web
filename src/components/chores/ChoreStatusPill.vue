<template>
  <span class="chore-status-pill" :class="`chore-status-pill--${status.state}`">
    {{ label }}
  </span>
</template>

<script>
/**
 * ChoreStatusPill — small uppercase label that names a chore's current
 * state on the Chores list row. Four states with distinct visual weight:
 *
 * - done      soft green wash       quiet celebration
 * - due       neutral paper chip    barely-there placeholder
 * - overdue   outlined red          the only state that pulls attention
 * - snoozed   soft amber wash       clearly a temporary detour
 *
 * The "days late" plural and the "until" date are resolved here so
 * consumers only need to hand in the status object from choreStatus().
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatDayMonth } from '@/utils/date.js'

export default {
  name: 'ChoreStatusPill',
  props: {
    /** Output of choreStatus(): { state, days?, until? } */
    status: { type: Object, required: true }
  },
  setup(props) {
    const { t } = useI18n()

    const label = computed(() => {
      const s = props.status

      if (s.state === 'done') return t('chores.statusDoneToday')

      if (s.state === 'overdue') {
        return s.days === 1
          ? t('chores.statusOverdueDay')
          : t('chores.statusOverdueDays', { count: s.days })
      }

      if (s.state === 'snoozed') {
        const date = s.until ? formatDayMonth(new Date(s.until)) : ''
        return t('chores.statusSnoozedUntil', { date })
      }

      return t('chores.statusDue')
    })

    return { label }
  }
}
</script>

<style lang="scss" scoped>
.chore-status-pill {
  @apply inline-flex shrink-0 items-center rounded-pill px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.04em];

  &--done {
    // color-mix is the project's standard for theme-aware translucent
    // backgrounds (see shadow-accent-glow in tailwind.config.mjs).
    background: color-mix(in oklab, var(--ok) 18%, transparent);
    @apply text-ok;
  }

  &--due {
    @apply bg-paper-3 text-muted;
  }

  &--overdue {
    @apply border border-bad text-bad;
  }

  &--snoozed {
    background: color-mix(in oklab, var(--warn) 18%, transparent);
    @apply text-warn;
  }
}
</style>
