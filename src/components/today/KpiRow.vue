<template>
  <div class="kpi-row" :style="{ '--kpi-cols': resolvedTiles.length }">
    <KpiTile
      v-for="tile in resolvedTiles"
      :key="tile.key"
      :label="tile.label"
      :value="tile.value"
      :unit="tile.unit"
    />
  </div>
</template>

<script>
/** KpiRow — grid of KPI tiles. Defaults to the 4 Today-view tiles; pass `tiles` to override. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import KpiTile from './KpiTile.vue'

const TODAY_TILE_DEFS = [
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
    /** Today-view KPI bag. Used only when `tiles` is not provided. */
    kpis: { type: Object, default: null },
    /** Pre-resolved tiles. Each: { key, label, value, unit }. Overrides `kpis`. */
    tiles: { type: Array, default: null }
  },
  setup(props) {
    const { t } = useI18n()

    const resolvedTiles = computed(() => {
      if (props.tiles) return props.tiles
      const k = props.kpis ?? {}
      return TODAY_TILE_DEFS.map(def => ({
        key: def.key,
        label: t(def.labelKey),
        value: def.get
          ? def.get(k)
          : t('kpi.hoursMinutes', {
              h: Math.floor((k.focusMinutes ?? 0) / 60),
              m: (k.focusMinutes ?? 0) % 60
            }),
        unit: t(def.unitKey)
      }))
    })

    return { resolvedTiles }
  }
}
</script>

<style lang="scss" scoped>
.kpi-row {
  // Default 2-up on phones; expand to the count of tiles on sm+.
  @apply grid grid-cols-2 gap-2.5 sm:gap-3.5;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  @media (min-width: 640px) {
    grid-template-columns: repeat(var(--kpi-cols, 4), minmax(0, 1fr));
  }
}
</style>
