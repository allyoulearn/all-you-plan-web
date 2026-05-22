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

    <span class="chore-row__streak">
      {{ chore.streak }}d
    </span>
  </div>
</template>

<script>
/** ChoreRow — single chore entry with completion checkbox, cadence pill, and streak counter. */
import { computed } from 'vue'
import Checkbox from '@/components/ui/Checkbox.vue'
import Pill from '@/components/ui/Pill.vue'

const CADENCE_LABEL = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly'
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

    /** Human-readable cadence label resolved from the API enum value. */
    const cadenceLabel = computed(() =>
      CADENCE_LABEL[props.chore.cadence.type] ?? props.chore.cadence.type
    )

    return { isCompletedToday, cadenceLabel }
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
