<template>
  <div class="heatmap">
    <!-- Grid: 26 columns, each column is 7 cells tall -->
    <div class="heatmap__grid">
      <div
        v-for="col in 26"
        :key="col"
        class="heatmap__col"
      >
        <div
          v-for="row in 7"
          :key="row"
          class="heatmap__cell"
          :class="intensityClass(values[(col - 1) * 7 + (row - 1)] ?? 0)"
        />
      </div>
    </div>

    <!-- Legend -->
    <div class="heatmap__legend">
      <span class="heatmap__legend-label">
        less
      </span>

      <div class="heatmap__swatch heatmap__swatch--empty" />

      <div class="heatmap__swatch heatmap__swatch--low" />

      <div class="heatmap__swatch heatmap__swatch--mid" />

      <div class="heatmap__swatch heatmap__swatch--full" />

      <span class="heatmap__legend-label">
        more
      </span>
    </div>
  </div>
</template>

<script>
/** Heatmap — 26-week x 7-day activity grid with intensity-coded cells and a legend. */

export default {
  name: 'Heatmap',
  props: {
    /** Array of 182 intensity values (0–3+) indexed as week * 7 + dayOfWeek */
    values: { type: Array, required: true }
  },
  setup() {
    // -- Function definitions --

    /**
     * Maps an intensity value to a BEM modifier class for the cell.
     * @param {number} v - Intensity value (0 = none, 1 = low, 2 = mid, 3+ = full)
     * @returns {string}
     */
    function intensityClass(v) {
      if (v === 0) return 'heatmap__cell--empty'
      if (v === 1) return 'heatmap__cell--low'
      if (v === 2) return 'heatmap__cell--mid'
      return 'heatmap__cell--full'
    }

    return { intensityClass }
  }
}
</script>

<style lang="scss" scoped>
.heatmap {
  &__grid {
    @apply flex gap-0.5;
  }

  &__col {
    @apply flex flex-col gap-0.5;
  }

  &__cell {
    @apply h-3 w-3 rounded-[2px];

    &--empty {
      @apply bg-paper-3;
    }

    &--low {
      background-color: color-mix(in srgb, var(--accent) 25%, transparent);
    }

    &--mid {
      background-color: color-mix(in srgb, var(--accent) 55%, transparent);
    }

    &--full {
      @apply bg-accent;
    }
  }

  &__legend {
    @apply mt-2.5 flex items-center gap-1.5;
  }

  &__legend-label {
    @apply font-mono text-[10px] text-muted;
  }

  &__swatch {
    @apply h-2.5 w-2.5 rounded-[2px];

    &--empty {
      @apply bg-paper-3;
    }

    &--low {
      background-color: color-mix(in srgb, var(--accent) 25%, transparent);
    }

    &--mid {
      background-color: color-mix(in srgb, var(--accent) 55%, transparent);
    }

    &--full {
      @apply bg-accent;
    }
  }
}
</style>
