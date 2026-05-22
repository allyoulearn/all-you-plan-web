<template>
  <div>
    <ScreenHeading eyebrow="Workspaces · Today" title="A quiet" emphasis="full day.">
      <template v-if="store.view" #meta>
        Sunrise {{ store.view.sunrise }}<br />Sunset {{ store.view.sunset }}
      </template>
    </ScreenHeading>

    <div v-if="store.loading" class="today-view__status">
      Loading…
    </div>

    <div v-else-if="store.error" class="today-view__status today-view__status--error">
      {{ store.error }}
    </div>

    <template v-else-if="store.view">
      <KpiRow :kpis="store.view.kpis" />

      <template v-for="group in groups" :key="group.label">
        <SectionHeader v-if="group.items.length" :label="group.label" :count="group.items.length" />

        <div v-if="group.items.length" class="today-view__task-group">
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
        class="today-view__empty"
      >
        Nothing scheduled for today. Add a task or plan with Wren.
      </div>

      <div class="today-view__actions">
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

<script>
/** TodayView — daily task board grouped by morning, afternoon, and evening time slots. */
import { onMounted, computed } from 'vue'
import { useTodayStore } from '@/stores/today.store.js'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Button from '@/components/ui/Button.vue'
import KpiRow from '@/components/today/KpiRow.vue'
import TaskRow from '@/components/today/TaskRow.vue'

export default {
  name: 'TodayView',
  components: { ScreenHeading, SectionHeader, Button, KpiRow, TaskRow },
  setup() {
    // -- State --
    const store = useTodayStore()

    // -- Computed --

    /**
     * Tasks grouped into Morning, Afternoon, and Evening based on scheduled hour.
     * Tasks with no scheduledTime default to hour 12 (Afternoon).
     */
    const groups = computed(() => {
      const tasks = store.view?.tasks ?? []
      return [
        { label: 'Morning', items: tasks.filter((t) => hourOf(t) < 12) },
        { label: 'Afternoon', items: tasks.filter((t) => hourOf(t) >= 12 && hourOf(t) < 17) },
        { label: 'Evening', items: tasks.filter((t) => hourOf(t) >= 17) },
      ]
    })

    // -- Lifecycle --
    onMounted(() => store.load())

    // -- Function definitions --

    /**
     * Extracts the hour from a task's scheduledTime string.
     * Defaults to 12 when scheduledTime is absent.
     * @param {{ scheduledTime?: string|null }} task
     * @returns {number}
     */
    function hourOf(task) {
      if (!task.scheduledTime) return 12
      return Number(task.scheduledTime.split(':')[0])
    }

    return { store, groups }
  }
}
</script>

<style lang="scss" scoped>
.today-view {
  &__status {
    @apply text-[13px] text-muted;

    &--error {
      @apply text-bad;
    }
  }

  &__task-group {
    @apply rounded-md bg-paper-2 px-2.5 py-1 shadow-sm;
  }

  &__empty {
    @apply mt-8 text-center text-[14px] text-muted;
  }

  &__actions {
    @apply mt-7 flex gap-2.5;
  }
}
</style>
