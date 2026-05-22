<script setup>
import { onMounted, computed } from 'vue'
import { useStatsStore } from '@/stores/stats.store'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Card from '@/components/ui/Card.vue'
import KpiTile from '@/components/today/KpiTile.vue'
import Heatmap from '@/components/stats/Heatmap.vue'

const store = useStatsStore()
onMounted(() => store.load())

const heatmapValues = computed(() => store.stats?.heatmap ?? Array(182).fill(0))

const topStreak = computed(() => {
  const habits = store.stats?.rankedHabits ?? []
  return habits.reduce((max, h) => Math.max(max, h.streak), 0)
})

const topBest = computed(() => {
  const habits = store.stats?.rankedHabits ?? []
  return habits.reduce((max, h) => Math.max(max, h.bestStreak), 0)
})
</script>

<template>
  <div>
    <ScreenHeading
      eyebrow="Looking back · Stats"
      title="Six months of"
      emphasis="showing up."
    />

    <div v-if="store.loading" class="text-[13px] text-muted">Loading…</div>
    <div v-else-if="store.error" class="text-[13px] text-bad">{{ store.error }}</div>

    <template v-else-if="store.stats">
      <!-- KPI strip -->
      <div class="mb-7 grid grid-cols-3 gap-3.5">
        <KpiTile label="Streak" :value="topStreak" unit="days" />
        <KpiTile label="Best" :value="topBest" unit="days" />
        <KpiTile label="Habits" :value="store.stats.rankedHabits.length" unit="tracked" />
      </div>

      <!-- Activity grid -->
      <SectionHeader label="Activity grid" />
      <Card>
        <Heatmap :values="heatmapValues" />
      </Card>

      <!-- Habits ranked -->
      <SectionHeader label="Habits ranked" :count="store.stats.rankedHabits.length" />
      <div v-if="store.stats.rankedHabits.length === 0" class="text-[13px] text-muted">
        No habits tracked yet.
      </div>
      <div v-else class="rounded-md bg-paper-2 px-2.5 py-1 shadow-sm">
        <div
          v-for="(habit, idx) in store.stats.rankedHabits"
          :key="habit.choreId"
          class="flex items-center gap-4 border-b border-rule-soft py-3.5 last:border-0"
        >
          <span class="w-6 font-mono text-[12px] text-muted">
            {{ String(idx + 1).padStart(2, '0') }}
          </span>
          <div class="flex flex-1 flex-col gap-0.5">
            <span class="text-[14px] text-ink">{{ habit.name }}</span>
            <span class="text-[12px] text-muted">
              {{ habit.streak }} days · best {{ habit.bestStreak }}
            </span>
          </div>
          <span class="font-mono text-[20px] font-medium text-ink">{{ habit.streak }}</span>
        </div>
      </div>
    </template>
  </div>
</template>
