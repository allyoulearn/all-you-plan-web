<template>
  <figure class="heatmap" :aria-label="t('stats.heatmapAriaLabel')">
    <figcaption class="heatmap__caption">
      {{ t('stats.heatmapCaption', { count: totalCompletions }) }}
    </figcaption>

    <!-- Grid: 26 columns, each column is 7 cells tall -->
    <div class="heatmap__grid" role="grid" :aria-label="t('stats.heatmapAriaLabel')">
      <div
        v-for="col in 26"
        :key="col"
        class="heatmap__col"
        role="row"
      >
        <div
          v-for="row in 7"
          :key="row"
          role="gridcell"
          class="heatmap__cell"
          :class="intensityClass(values[(col - 1) * 7 + (row - 1)] ?? 0)"
          :aria-label="cellLabel(col, row)"
        />
      </div>
    </div>

    <!-- Legend -->
    <div class="heatmap__legend" aria-hidden="true">
      <span class="heatmap__legend-label">
        {{ t('stats.heatmapLegendLess') }}
      </span>

      <div class="heatmap__swatch heatmap__swatch--empty" />

      <div class="heatmap__swatch heatmap__swatch--low" />

      <div class="heatmap__swatch heatmap__swatch--mid" />

      <div class="heatmap__swatch heatmap__swatch--full" />

      <span class="heatmap__legend-label">
        {{ t('stats.heatmapLegendMore') }}
      </span>
    </div>
  </figure>
</template>

<script>
/** Heatmap — 26-week x 7-day activity grid with intensity-coded cells and a legend. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default {
  name: 'Heatmap',
  props: {
    /** Array of 182 intensity values (0–3+) indexed as week * 7 + dayOfWeek */
    values: { type: Array, required: true }
  },
  setup(props) {
    const { t } = useI18n()
    // -- Anchor: most-recent Sunday at local midnight (WEB-W3-07).
    // Computed once at setup so every cellLabel call indexes off the same
    // stable base rather than re-deriving from `new Date()` per call.
    // The grid layout is: column 26 = current week, row 1 = Sunday.
    const gridAnchor = (() => {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      const sundayOffset = now.getDay() // 0..6, where 0=Sunday
      // Subtract today's day-of-week to land on the most-recent Sunday.
      now.setDate(now.getDate() - sundayOffset)
      return now
    })()

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

    /**
     * Returns an accessible label for a grid cell.
     * col is 1-indexed (1=oldest week, 26=most recent), row is 1-indexed (1=Sun, 7=Sat).
     * Dates are derived from a fixed gridAnchor (most-recent Sunday at local
     * midnight) to avoid the fragile per-cell `new Date()` arithmetic that
     * silently relied on today's weekday matching today's calendar position.
     * @param {number} col - Column index (1–26)
     * @param {number} row - Row index (1–7)
     * @returns {string}
     */
    function cellLabel(col, row) {
      const count = props.values[(col - 1) * 7 + (row - 1)] ?? 0
      const weeksAgo = 26 - col
      const cellDate = new Date(gridAnchor)
      // gridAnchor is the most-recent Sunday; offset back `weeksAgo` weeks
      // then add `row - 1` days to reach the cell's actual date.
      cellDate.setDate(gridAnchor.getDate() - weeksAgo * 7 + (row - 1))
      // Use the browser's default locale (undefined) for parity with
      // AppTopBar after WEB-T07-014 instead of the previous hardcoded 'en-US'.
      const dateStr = cellDate.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
      const dayName = DAY_NAMES[row - 1]
      const completions = count === 1 ? '1 completion' : `${count} completions`
      return `${dayName}, ${dateStr}: ${completions}`
    }

    /** Total completions across all cells, shown in the accessible figcaption. */
    const totalCompletions = computed(() =>
      props.values.reduce((sum, v) => sum + (v || 0), 0)
    )

    return { intensityClass, cellLabel, totalCompletions, t }
  }
}
</script>

<style lang="scss" scoped>
.heatmap {
  &__caption {
    @apply sr-only;
  }

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
