<template>
  <div class="kpi-row">
    <KpiTile
      v-for="tile in tiles"
      :key="tile.key"
      :label="tile.label"
      :value="tile.get(kpis)"
      :unit="tile.unit"
    />
  </div>
</template>

<script>
/** KpiRow — four-column grid of KPI tiles for the Today view header. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import KpiTile from './KpiTile.vue'

/**
 * Stable tile definitions. Labels/units route through i18n so the row
 * responds to locale changes (WEB-W3-14). The duration formatter uses the
 * `kpi.hoursMinutes` key so the "1h 5m" glyph is overridable per locale.
 */
const TILE_DEFS = [
  { key: 'streak', labelKey: 'kpi.streak', unitKey: 'kpi.unitDays', get: k => k.streak },
  {
    key: 'today',
    labelKey: 'kpi.today',
    unitKey: 'kpi.unitComplete',
    get: k => `${k.todayDone}/${k.todayTotal}`
  },
  {
    key: 'projects',
    labelKey: 'kpi.projects',
    unitKey: 'kpi.unitActive',
    get: k => k.activeProjects
  },
  { key: 'focus', labelKey: 'kpi.focus', unitKey: 'kpi.unitLogged', get: null }
]

export default {
  name: 'KpiRow',
  components: { KpiTile },
  props: {
    /** KPI data object with streak, todayDone, todayTotal, activeProjects, and focusMinutes */
    kpis: { type: Object, required: true }
  },
  setup() {
    const { t } = useI18n()
    const tiles = computed(() =>
      TILE_DEFS.map(def => ({
        key: def.key,
        label: t(def.labelKey),
        unit: t(def.unitKey),
        get:
          def.get ??
          (k => {
            const h = Math.floor((k.focusMinutes ?? 0) / 60)
            const m = (k.focusMinutes ?? 0) % 60
            return t('kpi.hoursMinutes', { h, m })
          })
      }))
    )
    return { tiles }
  }
}
</script>

<style lang="scss" scoped>
.kpi-row {
  @apply grid grid-cols-4 gap-3.5;
}
</style>
