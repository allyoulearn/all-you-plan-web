<script setup>
import KpiTile from './KpiTile.vue'

const props = defineProps({
  kpis: { type: Object, required: true },
})

const tiles = [
  { label: 'Streak', get: (k) => k.streak, unit: 'days' },
  { label: 'Today', get: (k) => `${k.todayDone}/${k.todayTotal}`, unit: 'complete' },
  { label: 'Projects', get: (k) => k.activeProjects, unit: 'active' },
  { label: 'Focus', get: (k) => `${Math.floor(k.focusMinutes / 60)}h ${k.focusMinutes % 60}m`, unit: 'logged' },
]
</script>

<template>
  <div class="grid grid-cols-4 gap-3.5">
    <KpiTile
      v-for="t in tiles"
      :key="t.label"
      :label="t.label"
      :value="t.get(props.kpis)"
      :unit="t.unit"
    />
  </div>
</template>
