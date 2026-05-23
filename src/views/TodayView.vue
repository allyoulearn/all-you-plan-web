<template>
  <div>
    <ScreenHeading eyebrow="Workspaces · Today" title="A quiet" emphasis="full day.">
      <template v-if="store.view" #meta>
        Sunrise {{ store.view.sunrise }}<br />Sunset {{ store.view.sunset }}
      </template>
    </ScreenHeading>

    <div v-if="store.loading" class="today-view__status">
      {{ t('common.loading') }}
    </div>

    <div v-else-if="store.error" class="today-view__status today-view__status--error">
      <span>
        {{ store.error }}
      </span>

      <Button size="sm" variant="ghost" @click="store.load()">
        {{ t('common.retry') }}
      </Button>
    </div>

    <template v-else-if="store.view">
      <KpiRow :kpis="store.view.kpis" />

      <template v-for="group in groups" :key="group.key">
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
        v-if="showEmpty"
        class="today-view__empty"
      >
        {{ t('today.emptyState') }}
      </div>

      <div class="today-view__actions">
        <Button variant="primary" @click="showCreateTask = true">
          {{ t('today.addTask') }}
        </Button>

        <Button variant="ghost" icon="bolt" @click="planWithWren">
          {{ t('today.planWithWren') }}
        </Button>

        <Button variant="ghost" @click="store.moveUnfinished">
          {{ t('today.moveUnfinished') }}
        </Button>
      </div>
    </template>

    <CreateTaskModal v-model="showCreateTask" />
  </div>
</template>

<script>
/** TodayView — daily task board grouped by morning, afternoon, and evening time slots. */
import { onMounted, computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTodayStore } from '@/stores/today.store.js'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Button from '@/components/ui/Button.vue'
import KpiRow from '@/components/today/KpiRow.vue'
import TaskRow from '@/components/today/TaskRow.vue'
import CreateTaskModal from '@/components/today/CreateTaskModal.vue'

export default {
  name: 'TodayView',
  components: { ScreenHeading, SectionHeader, Button, KpiRow, TaskRow, CreateTaskModal },
  setup() {
    // -- State --
    const store = useTodayStore()
    const router = useRouter()
    const { t } = useI18n()
    const showCreateTask = ref(false)

    // Prevents the empty-state flash on first mount and between mutation
    // reload cycles (WEB-W4-20). Mirrors the ChoresView pattern.
    const loaded = ref(!store.loading)
    watch(
      () => store.loading,
      isLoading => {
        if (isLoading) loaded.value = false
        else loaded.value = true
      }
    )

    /**
     * Open the Wren chat. Today this is a plain navigation — a future
     * iteration may pre-fill a planning prompt or pass context (e.g.
     * remaining tasks) via query params or a shared composable (WEB-W4-28).
     */
    function planWithWren() {
      router.push({ name: 'wren' })
    }

    // -- Computed --

    /**
     * Tasks grouped into Morning, Afternoon, and Evening based on scheduled hour.
     * Tasks with no scheduledTime default to hour 12 (Afternoon).
     * Labels are sourced from i18n so they react to locale changes (WEB-W4-01).
     */
    const groups = computed(() => {
      const tasks = store.view?.tasks ?? []
      return [
        {
          key: 'morning',
          label: t('today.morning'),
          items: tasks.filter(task => hourOf(task) < 12)
        },
        {
          key: 'afternoon',
          label: t('today.afternoon'),
          items: tasks.filter(task => hourOf(task) >= 12 && hourOf(task) < 17)
        },
        {
          key: 'evening',
          label: t('today.evening'),
          items: tasks.filter(task => hourOf(task) >= 17)
        }
      ]
    })

    /** True only once the initial load has resolved AND no groups have items. */
    const showEmpty = computed(() => loaded.value && !groups.value.some(g => g.items.length))

    // -- Lifecycle --
    onMounted(() => store.load())

    // -- Function definitions --

    /**
     * Extracts the hour from a task's scheduledTime string.
     * Defaults to 12 when scheduledTime is absent or malformed (WEB-W4-25).
     * @param {{ scheduledTime?: string|null }} task
     * @returns {number}
     */
    function hourOf(task) {
      if (!task.scheduledTime) return 12
      const h = Number(String(task.scheduledTime).split(':')[0])
      return Number.isFinite(h) ? h : 12
    }

    return { store, groups, t, showCreateTask, planWithWren, showEmpty }
  }
}
</script>

<style lang="scss" scoped>
.today-view {
  &__status {
    @apply flex items-center gap-2 text-[13px] text-muted;

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
