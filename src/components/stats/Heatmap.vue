<template>
  <figure
    ref="rootRef"
    class="heatmap"
    :aria-label="t('stats.heatmapAriaLabel')"
    @mouseleave="hideTooltip"
  >
    <figcaption class="heatmap__caption">
      {{ t('stats.heatmapCaption', { count: totalCompletions }) }}
    </figcaption>

    <!-- Month labels row. Each label is anchored to the column that contains
         the 1st of that month (not the column's Sunday) so the label sits
         visually over the day the month actually begins. -->
    <div class="heatmap__months" aria-hidden="true">
      <span class="heatmap__day-spacer" />

      <div class="heatmap__months-grid">
        <span
          v-for="m in monthLabels"
          :key="m.key"
          class="heatmap__month"
          :style="{ gridColumn: `${m.col} / span ${m.span}` }"
        >
          {{ m.label }}
        </span>
      </div>
    </div>

    <!-- Per-week label row — day-of-month of each week's Sunday, so every
         one of the 26 columns gets identified. Paired with the month row
         above it gives the user a precise "what week am I looking at?"
         read without resorting to the hover tooltip. -->
    <div class="heatmap__weeks" aria-hidden="true">
      <span class="heatmap__day-spacer" />

      <div class="heatmap__weeks-grid">
        <span
          v-for="w in weekLabels"
          :key="w.col"
          class="heatmap__week"
        >
          {{ w.day }}
        </span>
      </div>
    </div>

    <!-- Body: day-of-week letters on the left, intensity grid on the right -->
    <div class="heatmap__body">
      <div class="heatmap__days" aria-hidden="true">
        <!-- One letter per row, S–S, top to bottom. Each row maps to one
             day-of-week and each label sits centred on its corresponding
             cell row thanks to the `flex: 1` distribution on `__day`. -->
        <span v-for="(d, i) in DAY_LETTERS" :key="i" class="heatmap__day">
          {{ d }}
        </span>
      </div>

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
            tabindex="0"
            @mouseenter="showTooltip(col, row, $event)"
            @focus="showTooltip(col, row, $event)"
            @blur="hideTooltip"
          />
        </div>
      </div>
    </div>

    <!-- Hover/focus tooltip. Positioned absolutely inside the figure so it
         floats above the grid without affecting layout; the parent figure
         is the offset reference for the inline `top` / `left` set in
         `showTooltip`. -->
    <div
      v-if="tooltip"
      class="heatmap__tooltip"
      role="status"
      :style="{ top: `${tooltip.y}px`, left: `${tooltip.x}px` }"
    >
      <div class="heatmap__tooltip-count">
        <strong>
          {{ tooltip.count }}
        </strong>

        <span>
          {{ tooltip.count === 1 ? 'completion' : 'completions' }}
        </span>
      </div>

      <div class="heatmap__tooltip-date">
        {{ tooltip.date }}
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
/** Heatmap — 26-week × 7-day activity grid with intensity-coded cells, day-
 *  of-week labels on the left, month labels along the top (anchored to the
 *  column where the 1st of the month actually falls), and a hover/focus
 *  tooltip surfacing the date and completion count for each cell. */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default {
  name: 'Heatmap',
  props: {
    /** Array of 182 intensity values (0–3+) indexed as week * 7 + dayOfWeek */
    values: { type: Array, required: true }
  },
  setup(props) {
    const { t } = useI18n()
    const rootRef = ref(null)
    const tooltip = ref(null)

    // Anchor: most-recent Sunday at local midnight. Computed once at setup
    // so every cellLabel call indexes off the same stable base rather than
    // re-deriving from `new Date()` per call. Grid layout: column 26 =
    // current week, row 1 = Sunday.
    const gridAnchor = (() => {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      const sundayOffset = now.getDay()
      now.setDate(now.getDate() - sundayOffset)
      return now
    })()

    /** Total completions across all cells, shown in the accessible figcaption. */
    const totalCompletions = computed(() =>
      props.values.reduce((sum, v) => sum + (v || 0), 0)
    )

    /**
     * Month labels positioned at the column that contains the 1st of each
     * month. Walks every day in the 26-week range looking for day-of-month
     * === 1, then emits one label at that column. `span` is filled in when
     * the next month is detected (or set to the trailing run for the last
     * label) so `grid-column: ${col} / span ${span}` aligns the label over
     * the columns the month occupies.
     */
    /**
     * One label per column — day-of-month of each week's Sunday. The month
     * row above provides the month context, so a single digit / two-digit
     * number is enough to anchor the column to a specific week.
     */
    const weekLabels = computed(() =>
      Array.from({ length: 26 }, (_, i) => {
        const col = i + 1
        const weeksAgo = 26 - col
        const sun = new Date(gridAnchor)
        sun.setDate(gridAnchor.getDate() - weeksAgo * 7)
        return { col, day: sun.getDate() }
      })
    )

    const monthLabels = computed(() => {
      const labels = []

      for (let col = 1; col <= 26; col++) {
        const weeksAgo = 26 - col
        const sundayOfCol = new Date(gridAnchor)
        sundayOfCol.setDate(gridAnchor.getDate() - weeksAgo * 7)

        for (let d = 0; d < 7; d++) {
          const day = new Date(sundayOfCol)
          day.setDate(sundayOfCol.getDate() + d)

          if (day.getDate() === 1) {
            const m = day.getMonth()

            if (labels.length) {
              labels[labels.length - 1].span = col - labels[labels.length - 1].col
            }

            labels.push({ key: `${m}-${col}`, label: MONTH_ABBR[m], col, span: 27 - col })
          }
        }
      }

      return labels
    })

    return {
      rootRef,
      tooltip,
      intensityClass,
      cellLabel,
      cellDateString,
      cellDateForTooltip,
      showTooltip,
      hideTooltip,
      totalCompletions,
      monthLabels,
      weekLabels,
      DAY_LETTERS,
      t
    }

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
     * Compute the Date for a given column/row in the grid.
     * @param {number} col - 1-indexed column (1=oldest week, 26=most recent)
     * @param {number} row - 1-indexed row (1=Sun, 7=Sat)
     * @returns {Date}
     */
    function cellDate(col, row) {
      const weeksAgo = 26 - col
      const d = new Date(gridAnchor)
      d.setDate(gridAnchor.getDate() - weeksAgo * 7 + (row - 1))
      return d
    }

    /** Formatted human date string used by both the aria-label and tooltip. */
    function cellDateString(col, row) {
      return cellDate(col, row).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }

    /** Wordy date string used only by the screen-reader aria-label. */
    function cellDateForTooltip(col, row) {
      return cellDateString(col, row)
    }

    /** Accessible label string, exposed verbatim to screen readers. */
    function cellLabel(col, row) {
      const count = props.values[(col - 1) * 7 + (row - 1)] ?? 0
      const dayName = DAY_NAMES[row - 1]

      const longDate = cellDate(col, row).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })

      const completions = count === 1 ? '1 completion' : `${count} completions`
      return `${dayName}, ${longDate}: ${completions}`
    }

    /**
     * Open the tooltip over the hovered/focused cell. Computes the floating
     * card's offset relative to the figure's own bounding rect so the inline
     * `top` / `left` stay correct as the page scrolls or resizes — we don't
     * need a viewport-fixed position because the figure itself owns the
     * positioning context (`position: relative`).
     */
    function showTooltip(col, row, event) {
      const cell = event.currentTarget
      const root = rootRef.value
      if (!cell || !root) return

      const cellRect = cell.getBoundingClientRect()
      const rootRect = root.getBoundingClientRect()
      const count = props.values[(col - 1) * 7 + (row - 1)] ?? 0

      tooltip.value = {
        date: cellDateString(col, row),
        count,
        x: cellRect.left - rootRect.left + cellRect.width / 2,
        y: cellRect.top - rootRect.top
      }
    }

    /** Close the tooltip (called on cell blur / leaving the figure). */
    function hideTooltip() {
      tooltip.value = null
    }
  }
}
</script>

<style lang="scss" scoped>
.heatmap {
  // Per-instance sizing knobs — change here to scale the whole component.
  --heatmap-cell: 18px;
  --heatmap-gap: 4px;
  --heatmap-day-col: 22px;

  @apply relative;

  &__caption {
    @apply sr-only;
  }

  // -- Month labels row -------------------------------------------------

  &__months {
    @apply mb-1.5 flex items-end;
  }

  &__day-spacer {
    width: var(--heatmap-day-col);
    flex-shrink: 0;
  }

  &__months-grid {
    @apply grid flex-1;
    grid-template-columns: repeat(26, minmax(0, 1fr));
    gap: var(--heatmap-gap);
  }

  &__month {
    @apply truncate font-mono text-[10px] uppercase tracking-wider;
    color: var(--muted);
  }

  // -- Per-week row (day-of-month of each Sunday) ----------------------

  &__weeks {
    @apply mb-2 flex items-end;
  }

  &__weeks-grid {
    @apply grid flex-1;
    grid-template-columns: repeat(26, minmax(0, 1fr));
    gap: var(--heatmap-gap);
  }

  &__week {
    @apply text-center font-mono text-[9px];
    color: color-mix(in oklab, var(--muted) 70%, transparent);
  }

  // -- Body (day labels + grid) ----------------------------------------

  &__body {
    // `items-stretch` is the default but stated explicitly here because the
    // day-label column relies on stretching to the grid's natural height
    // (so its `flex: 1` children distribute the height evenly into rows
    // that line up with the responsive grid cells). Using `items-start`
    // would collapse the day column to its content height and the M / W /
    // F letters would bunch at the top of the heatmap.
    @apply flex items-stretch;
  }

  &__days {
    // Stretches to match the grid's height (default `align-items: stretch`
    // on the flex parent `__body`), then each label takes `flex: 1` of that
    // height. The grid's height grows with the responsive cell size, so the
    // labels stay row-aligned at every viewport width — fixing the previous
    // bug where 18px-tall labels bunched at the top once cells became ~38px
    // squares in the wider main column.
    @apply flex flex-col;
    width: var(--heatmap-day-col);
    gap: var(--heatmap-gap);
    flex-shrink: 0;
  }

  &__day {
    @apply flex flex-1 items-center font-mono text-[10px];
    color: var(--muted);
  }

  &__grid {
    @apply flex flex-1;
    gap: var(--heatmap-gap);
  }

  &__col {
    @apply flex flex-1 flex-col;
    gap: var(--heatmap-gap);
  }

  &__cell {
    // `flex: 1 0 auto` lets cells grow to fill any extra column height
    // donated by the day-label column when labels' line-height exceeds the
    // aspect-ratio-derived cell size (i.e. narrow viewports). Without it,
    // cells stay 6–10px tall at the top of a 118px column on mobile and
    // the S/M/T/W/T/F/S labels — distributed evenly via flex-1 — sit
    // below their corresponding rows. The basis stays `auto` so the
    // aspect-ratio still drives the intrinsic size on wider viewports
    // where no growth is needed.
    @apply cursor-pointer rounded;
    flex: 1 0 auto;
    width: 100%;
    aspect-ratio: 1;
    transition: transform 80ms ease, box-shadow 80ms ease;

    &:hover,
    &:focus-visible {
      transform: scale(1.15);
      outline: none;
      box-shadow: 0 0 0 1px var(--ink);
    }

    &--empty {
      background: var(--paper-3);
    }

    &--low {
      background-color: color-mix(in srgb, var(--accent) 25%, transparent);
    }

    &--mid {
      background-color: color-mix(in srgb, var(--accent) 60%, transparent);
    }

    &--full {
      @apply bg-accent;
    }
  }

  // -- Tooltip ---------------------------------------------------------

  &__tooltip {
    // Absolutely positioned relative to the .heatmap figure. `translate`
    // centres the card horizontally over the cell and lifts it above by
    // its own height + a small gap, so the bottom edge sits just above
    // the hovered cell. `pointer-events: none` keeps the tooltip out of
    // the hit-test so the mouseleave on the cell still fires reliably.
    @apply pointer-events-none absolute z-10 whitespace-nowrap rounded-md border border-rule-soft px-3 py-2 shadow-md;
    background: var(--paper-2);
    transform: translate(-50%, calc(-100% - 8px));
  }

  &__tooltip-count {
    @apply flex items-baseline gap-1.5 text-[13px];
    color: var(--ink);

    strong {
      @apply font-medium;
    }

    span {
      color: var(--muted);
    }
  }

  &__tooltip-date {
    @apply font-mono text-[10px] uppercase tracking-wider;
    color: var(--muted);
  }

  // -- Legend ----------------------------------------------------------

  &__legend {
    @apply mt-3.5 flex items-center justify-end gap-1.5;
  }

  &__legend-label {
    @apply font-mono text-[10px];
    color: var(--muted);
  }

  &__swatch {
    @apply rounded;
    width: 12px;
    height: 12px;

    &--empty {
      background: var(--paper-3);
    }

    &--low {
      background-color: color-mix(in srgb, var(--accent) 25%, transparent);
    }

    &--mid {
      background-color: color-mix(in srgb, var(--accent) 60%, transparent);
    }

    &--full {
      @apply bg-accent;
    }
  }
}
</style>
