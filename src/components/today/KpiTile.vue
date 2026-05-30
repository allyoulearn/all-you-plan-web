<template>
  <div class="kpi-tile">
    <!-- Label -->
    <span class="kpi-tile__label">
      {{ label }}
    </span>

    <!-- Value with optional emphasis -->
    <span class="kpi-tile__value">
      {{ value }}<em v-if="emphasis" class="kpi-tile__emphasis">
        {{ emphasis }}
      </em>
    </span>

    <!-- Unit -->
    <span v-if="unit" class="kpi-tile__unit">
      {{ unit }}
    </span>
  </div>
</template>

<script>
/** KpiTile — single KPI metric card with label, value, optional emphasis, and unit. */

export default {
  name: 'KpiTile',
  props: {
    /** Display label for the metric */
    label: { type: String, required: true },
    /** Primary metric value (string or number) */
    value: { type: [String, Number], required: true },
    /** Optional italic suffix appended to value */
    emphasis: { type: String, default: '' },
    /** Unit label displayed below value */
    unit: { type: String, default: '' }
  }
}
</script>

<style lang="scss" scoped>
.kpi-tile {
  @apply flex flex-col gap-1 rounded-md bg-paper-2 p-5 shadow-sm;

  &__label {
    @apply text-[12px] font-medium text-muted;
  }

  &__value {
    @apply mt-1.5 font-serif text-[40px] leading-none tracking-[-0.02em] text-ink;
  }

  &__emphasis {
    @apply italic;
  }

  &__unit {
    @apply text-[12px] text-muted;
  }
}
</style>
