<template>
  <div class="kpi-row">
    <KpiTile
      v-for="t in tiles"
      :key="t.label"
      :label="t.label"
      :value="t.get(kpis)"
      :unit="t.unit"
    />
  </div>
</template>

<script>
/** KpiRow — four-column grid of KPI tiles for the Today view header. */
import KpiTile from './KpiTile.vue'

/** @type {Array<{label: string, get: (k: object) => string|number, unit: string}>} */
const tiles = [
  { label: 'Streak', get: (k) => k.streak, unit: 'days' },
  { label: 'Today', get: (k) => `${k.todayDone}/${k.todayTotal}`, unit: 'complete' },
  { label: 'Projects', get: (k) => k.activeProjects, unit: 'active' },
  { label: 'Focus', get: (k) => `${Math.floor(k.focusMinutes / 60)}h ${k.focusMinutes % 60}m`, unit: 'logged' },
]

export default {
  name: 'KpiRow',
  components: { KpiTile },
  props: {
    /** KPI data object with streak, todayDone, todayTotal, activeProjects, and focusMinutes */
    kpis: { type: Object, required: true }
  },
  setup() {
    return { tiles }
  }
}
</script>

<style lang="scss" scoped>
.kpi-row {
  @apply grid grid-cols-4 gap-3.5;
}
</style>
