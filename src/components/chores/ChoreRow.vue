<template>
  <div class="chore-row">
    <Checkbox
      :model-value="isCompletedToday(chore.lastCompletedOn)"
      @update:model-value="$emit('complete', chore.id)"
    />

    <span class="chore-row__body">
      <span
        class="chore-row__title"
        :class="isCompletedToday(chore.lastCompletedOn)
          ? 'chore-row__title--muted'
          : 'chore-row__title--active'"
      >
        {{ chore.title }}
      </span>
    </span>

    <Pill variant="default">
      {{ cadenceLabel }}
    </Pill>

    <span class="chore-row__streak" :aria-label="streakAria">
      {{ streakLabel }}
    </span>
  </div>
</template>

<script>
/** ChoreRow — single chore entry with completion checkbox, cadence pill, and streak counter. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Checkbox from '@/components/ui/Checkbox.vue'
import Pill from '@/components/ui/Pill.vue'

/**
 * Map from API cadence enum to the matching i18n key (WEB-W3-17). The keys
 * already live under `chores.cadence*` and are used by CreateChoreModal —
 * routing through i18n keeps modal and row labels in sync.
 */
const CADENCE_KEY = {
  daily: 'chores.cadenceDaily',
  weekly: 'chores.cadenceWeekly',
  monthly: 'chores.cadenceMonthly'
}

export default {
  name: 'ChoreRow',
  components: { Checkbox, Pill },
  props: {
    /** The chore object to display */
    chore: { type: Object, required: true }
  },
  emits: ['complete'],
  setup(props) {
    const { t } = useI18n()
    // -- Function definitions --

    /**
     * Returns true if the given date string represents today in the user's local timezone.
     * Uses toLocaleDateString with 'en-CA' to get an ISO-format date (YYYY-MM-DD) in
     * local time, avoiding UTC-vs-local mismatch for users west of UTC.
     * @param {string|null} lastCompletedOn - ISO date string or null
     * @returns {boolean}
     */
    function isCompletedToday(lastCompletedOn) {
      if (!lastCompletedOn) return false
      const today = new Date().toLocaleDateString('en-CA')
      return lastCompletedOn.slice(0, 10) === today
    }

    /** Human-readable cadence label resolved from the API enum value via i18n. */
    const cadenceLabel = computed(() => {
      const key = CADENCE_KEY[props.chore.cadence.type]
      return key ? t(key) : props.chore.cadence.type
    })

    // Streak label (WEB-W3-16). Visible glyph stays the compact "{n}d"
    // because the row is intentionally dense, but the aria-label expands to
    // the full localized phrase so screen readers say "5 days" instead of
    // "5 d".
    const streakLabel = computed(() => t('chores.streakShort', { count: props.chore.streak }))
    const streakAria = computed(() => t('chores.streakDays', { count: props.chore.streak }))

    return { isCompletedToday, cadenceLabel, streakLabel, streakAria }
  }
}
</script>

<style lang="scss" scoped>
.chore-row {
  @apply flex items-center gap-3.5 rounded-lg px-2 py-3 transition-colors hover:bg-paper-3;

  &__body {
    @apply min-w-0 flex-1;
  }

  &__title {
    @apply block text-[14px];

    &--muted {
      @apply text-muted;
    }

    &--active {
      @apply text-ink;
    }
  }

  &__streak {
    @apply font-mono text-[11px] tracking-wide text-muted;
  }
}
</style>
