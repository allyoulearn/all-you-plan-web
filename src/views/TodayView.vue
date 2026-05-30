<template>
  <div>
    <!-- Screen heading -->
    <AppScreenHeading
      :eyebrow="`${t('nav.workspaces')} · ${t('nav.itemToday')}`"
      :title="t('today.headingPrefix')"
      :emphasis="t('today.headingEmphasis')"
    >
      <template v-if="store.view" #meta>
        <span v-if="store.view.sunrise" class="today-view__meta-line">
          <AppIcon name="sun" :size="14" class="today-view__meta-icon" />
          {{ t('today.sunriseLabel') }} {{ store.view.sunrise }}
        </span>

        <span v-if="store.view.sunset" class="today-view__meta-line">
          <AppIcon name="moon" :size="14" class="today-view__meta-icon" />
          {{ t('today.sunsetLabel') }} {{ store.view.sunset }}
        </span>
      </template>
    </AppScreenHeading>

    <!-- Daily briefing -->
    <BriefingCard
      v-if="briefingStore.briefing"
      :state="briefingStore.briefing.state"
      :greeting="briefingStore.briefing.greeting"
      :tone="briefingStore.briefing.tone"
      :actions="briefingStore.briefing.actions"
      @talk="planWithWren"
      @regenerate="briefingStore.regenerate"
      @action="onBriefingAction"
    />

    <!-- Briefing loading placeholder -->
    <BriefingCard
      v-else
      state="loading"
      greeting=""
      tone="warm"
      :actions="[]"
    />

    <!-- Loading state -->
    <div v-if="store.loading" class="today-view__status">
      {{ t('common.loading') }}
    </div>

    <!-- Error state -->
    <div v-else-if="store.error" class="today-view__status today-view__status--error">
      <span>
        {{ store.error }}
      </span>

      <AppButton size="sm" variant="ghost" @click="store.load()">
        {{ t('common.retry') }}
      </AppButton>
    </div>

    <!-- Today content -->
    <template v-else-if="store.view">
      <!-- KPI row -->
      <KpiRow :kpis="store.view.kpis" />

      <!-- Task lanes by time of day -->
      <template v-for="group in groups" :key="group.key">
        <AppSectionHeader :label="group.label" :count="group.items.length" />

        <div
          class="today-view__task-group"
          :class="{
            'today-view__task-group--empty': !group.items.length,
            'today-view__task-group--drop': dropLane === group.key
          }"
          :data-lane="group.key"
          @dragover.prevent="onLaneDragOver($event, group)"
          @dragleave="onLaneDragLeave(group)"
          @drop.prevent="onLaneDrop($event, group)"
        >
          <div
            v-for="task in group.items"
            :key="task.id"
            class="today-view__task-row-wrap"
            :class="{ 'today-view__task-row-wrap--dragging': draggingId === task.id }"
            draggable="true"
            @dragstart="onTaskDragStart($event, task)"
            @dragend="onTaskDragEnd"
          >
            <TaskRow :task="task" @complete="store.completeTask" />
          </div>

          <p v-if="!group.items.length" class="today-view__lane-empty">
            {{ t('today.laneDropHint') }}
          </p>
        </div>
      </template>

      <!-- Empty state -->
      <div
        v-if="showEmpty"
        class="today-view__empty"
      >
        {{ t('today.emptyState') }}
      </div>

      <!-- Action bar -->
      <div class="today-view__actions">
        <AppButton variant="primary" @click="showCreateTask = true">
          {{ t('today.addTask') }}
        </AppButton>

        <AppButton variant="ghost" icon="bolt" @click="planWithWren">
          {{ t('today.planWithWren') }}
        </AppButton>

        <AppButton variant="ghost" @click="showMoveUnfinishedConfirm = true">
          {{ t('today.moveUnfinished') }}
        </AppButton>
      </div>
    </template>

    <!-- Create task modal -->
    <CreateTaskModal v-model="showCreateTask" />

    <!-- Move unfinished confirmation -->
    <AppConfirmDialog
      v-model="showMoveUnfinishedConfirm"
      :title="t('today.moveUnfinishedConfirmTitle')"
      :message="t('today.moveUnfinishedConfirmMessage')"
      :confirm-label="t('today.moveUnfinishedConfirmCta')"
      :cancel-label="t('common.cancel')"
      :busy="store.saving"
      :busy-label="t('today.movingUnfinished')"
      @confirm="confirmMoveUnfinished"
    />
  </div>
</template>

<script>
/** TodayView — daily task board grouped by morning, afternoon, and evening time slots. */
import { onMounted, computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTodayStore } from '@/stores/today.store.js'
import { useBriefingStore } from '@/stores/briefing.store.js'
import { useOverlaysStore } from '@/stores/overlays.store.js'
import AppScreenHeading from '@/components/ui/AppScreenHeading.vue'
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import KpiRow from '@/components/today/KpiRow.vue'
import TaskRow from '@/components/today/TaskRow.vue'
import CreateTaskModal from '@/components/today/CreateTaskModal.vue'
import BriefingCard from '@/components/briefing/BriefingCard.vue'

export default {
  name: 'TodayView',
  components: {
    AppScreenHeading,
    AppSectionHeader,
    AppButton,
    AppIcon,
    AppConfirmDialog,
    KpiRow,
    TaskRow,
    CreateTaskModal,
    BriefingCard
  },
  setup() {
    // -- State --
    const store = useTodayStore()
    const briefingStore = useBriefingStore()
    const overlays = useOverlaysStore()
    const router = useRouter()
    const { t } = useI18n()
    const showCreateTask = ref(false)
    const showMoveUnfinishedConfirm = ref(false)
    /** id of the task currently being dragged; null when no drag in flight. */
    const draggingId = ref(null)
    /** Lane key currently under the pointer; null otherwise. */
    const dropLane = ref(null)

    /** Default scheduled time for each lane. Dropping into a lane sets the
     *  dragged task's scheduledTime to this. */
    const LANE_TIME = {
      morning: '09:00',
      afternoon: '13:00',
      evening: '18:00'
    }

    // Prevents the empty-state flash on first mount and between mutation
    // reload cycles. Mirrors the ChoresView pattern.
    const loaded = ref(!store.loading)

    watch(
      () => store.loading,
      isLoading => {
        if (isLoading) loaded.value = false
        else loaded.value = true
      }
    )

    // -- Computed --

    /**
     * Tasks grouped into Morning, Afternoon, and Evening based on scheduled hour.
     * Tasks with no scheduledTime default to hour 12 (Afternoon).
     * Labels are sourced from i18n so they react to locale changes.
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
    onMounted(() => {
      store.load()
      briefingStore.load()
    })

    return {
      store,
      briefingStore,
      groups,
      t,
      showCreateTask,
      showMoveUnfinishedConfirm,
      confirmMoveUnfinished,
      planWithWren,
      showEmpty,
      draggingId,
      dropLane,
      onTaskDragStart,
      onTaskDragEnd,
      onLaneDragOver,
      onLaneDragLeave,
      onLaneDrop,
      onBriefingAction
    }

    // -- Function definitions --

    /**
     * Open the Wren chat. Today this is a plain navigation — a future
     * iteration may pre-fill a planning prompt or pass context (e.g.
     * remaining tasks) via query params or a shared composable.
     */
    function planWithWren() {
      router.push({ name: 'wren' })
    }

    /**
     * Confirm handler for the move-unfinished dialog. Runs the bulk
     * reschedule, then closes the dialog on success. On failure the dialog
     * stays open so the user can retry — the store surfaces the error toast.
     */
    async function confirmMoveUnfinished() {
      try {
        await store.moveUnfinished()
        showMoveUnfinishedConfirm.value = false
      } catch {
        // Toast surfaced by the store; keep the dialog open for retry.
      }
    }

    function onBriefingAction(action) {
      if (action.kind === 'capture') overlays.openCapture()
      else if (action.kind === 'schedule') router.push({ name: 'calendar' })
      else if (action.kind === 'snooze') {
        // For now route to chat where Wren can confirm. Wiring real snooze
        // requires resolving which task/chore the action targets.
        router.push({ name: 'wren' })
      }
    }

    /**
     * Extracts the hour from a task's scheduledTime string.
     * Defaults to 12 when scheduledTime is absent or malformed.
     * @param {{ scheduledTime?: string|null }} task
     * @returns {number}
     */
    function hourOf(task) {
      if (!task.scheduledTime) return 12
      const h = Number(String(task.scheduledTime).split(':')[0])
      return Number.isFinite(h) ? h : 12
    }

    // -- Drag handlers --

    function onTaskDragStart(e, task) {
      draggingId.value = task.id
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', task.id)
    }

    function onTaskDragEnd() {
      draggingId.value = null
      dropLane.value = null
    }

    function onLaneDragOver(e, group) {
      if (!draggingId.value) return
      e.dataTransfer.dropEffect = 'move'
      dropLane.value = group.key
    }

    function onLaneDragLeave(group) {
      if (dropLane.value === group.key) dropLane.value = null
    }

    async function onLaneDrop(e, group) {
      const id = e.dataTransfer.getData('text/plain')
      dropLane.value = null
      draggingId.value = null
      if (!id) return
      const task = store.view?.tasks?.find(t => t.id === id)
      if (!task) return
      const nextTime = LANE_TIME[group.key]
      if (!nextTime) return
      // Skip the round trip if the task is already in that band — the
      // hourOf computation handles boundaries; a same-lane drop just
      // returns without firing the mutation.
      const currentLane = groups.value.find(g => g.items.some(t => t.id === id))?.key
      if (currentLane === group.key) return

      try {
        await store.rescheduleTask(id, { scheduledTime: nextTime })
      } catch {
        // Toast surfaced by the store.
      }
    }
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

  &__meta-line {
    @apply flex items-center justify-end gap-1.5 leading-relaxed;
  }

  &__meta-icon {
    @apply text-muted;
  }

  &__task-group {
    @apply rounded-md bg-paper-2 px-2.5 py-1 shadow-sm transition-colors;

    &--empty {
      @apply min-h-[44px] border border-dashed border-rule-soft bg-paper px-2.5 py-2;
    }

    &--drop {
      @apply bg-paper-3 ring-2 ring-accent;
    }
  }

  &__task-row-wrap {
    @apply cursor-grab;

    &:active {
      @apply cursor-grabbing;
    }

    &--dragging {
      @apply opacity-40;
    }
  }

  &__lane-empty {
    @apply text-[12px] italic text-muted;
  }

  &__empty {
    @apply mt-8 text-center text-[14px] text-muted;
  }

  &__actions {
    @apply mt-7 flex flex-wrap gap-2.5;
  }
}
</style>
