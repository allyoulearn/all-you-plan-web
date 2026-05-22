<template>
  <div>
    <ScreenHeading eyebrow="Workspaces · Today" title="A quiet" emphasis="full day.">
      <template v-if="store.view" #meta>
        Sunrise {{ store.view.sunrise }}<br />Sunset {{ store.view.sunset }}
      </template>
    </ScreenHeading>

    <div v-if="store.loading" class="text-[13px] text-muted">
      Loading…
    </div>

    <div v-else-if="store.error" class="text-[13px] text-bad">
      {{ store.error }}
    </div>

    <template v-else-if="store.view">
      <KpiRow :kpis="store.view.kpis" />

      <template v-for="group in groups" :key="group.label">
        <SectionHeader v-if="group.items.length" :label="group.label" :count="group.items.length" />

        <div v-if="group.items.length" class="rounded-md bg-paper-2 px-2.5 py-1 shadow-sm">
          <TaskRow
            v-for="task in group.items"
            :key="task.id"
            :task="task"
            @complete="store.completeTask"
          />
        </div>
      </template>

      <div
        v-if="!groups.some((g) => g.items.length)"
        class="mt-8 text-center text-[14px] text-muted"
      >
        Nothing scheduled for today. Add a task or plan with Wren.
      </div>

      <div class="mt-7 flex gap-2.5">
        <Button variant="primary">
          Add to today
        </Button>

        <Button variant="ghost" icon="bolt">
          Plan with Wren
        </Button>

        <Button variant="ghost" @click="store.moveUnfinished">
          Move unfinished to tomorrow
        </Button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useTodayStore } from '@/stores/today.store'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Button from '@/components/ui/Button.vue'
import KpiRow from '@/components/today/KpiRow.vue'
import TaskRow from '@/components/today/TaskRow.vue'

const store = useTodayStore()
onMounted(() => store.load())

function hourOf(task) {
  if (!task.scheduledTime) return 12
  return Number(task.scheduledTime.split(':')[0])
}
const groups = computed(() => {
  const tasks = store.view?.tasks ?? []
  return [
    { label: 'Morning', items: tasks.filter((t) => hourOf(t) < 12) },
    { label: 'Afternoon', items: tasks.filter((t) => hourOf(t) >= 12 && hourOf(t) < 17) },
    { label: 'Evening', items: tasks.filter((t) => hourOf(t) >= 17) },
  ]
})
</script>
