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
      {{ chore.cadence.type }}
    </Pill>

    <span class="chore-row__streak">
      {{ chore.streak }}d
    </span>
  </div>
</template>

<script>
/** ChoreRow — single chore entry with completion checkbox, cadence pill, and streak counter. */
import Checkbox from '@/components/ui/Checkbox.vue'
import Pill from '@/components/ui/Pill.vue'

export default {
  name: 'ChoreRow',
  components: { Checkbox, Pill },
  props: {
    /** The chore object to display */
    chore: { type: Object, required: true }
  },
  emits: ['complete'],
  setup() {
    // -- Function definitions --

    /**
     * Returns true if the given date string represents today.
     * @param {string|null} lastCompletedOn - ISO date string or null
     * @returns {boolean}
     */
    function isCompletedToday(lastCompletedOn) {
      if (!lastCompletedOn) return false
      const today = new Date().toISOString().slice(0, 10)
      return lastCompletedOn.slice(0, 10) === today
    }

    return { isCompletedToday }
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
