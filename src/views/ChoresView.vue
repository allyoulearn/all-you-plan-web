<template>
  <div>
    <!-- Screen heading -->
    <AppScreenHeading
      :eyebrow="`${t('nav.workspaces')} · ${t('nav.itemChores')}`"
      :title="t('chores.headingPrefix')"
      :emphasis="t('chores.headingEmphasis')"
    />

    <!-- Loading skeleton -->
    <ChoresSkeleton v-if="store.loading && !loaded" />

    <!-- Error state -->
    <div v-else-if="store.error" class="chores-view__status chores-view__status--error">
      <span>{{ store.error }}</span>
      <AppButton size="sm" variant="ghost" @click="store.load()">{{ t('common.retry') }}</AppButton>
    </div>

    <!-- Empty state (loaded, no chores) -->
    <ChoresEmpty v-else-if="loaded && allChores.length === 0" @create="showCreate = true" />

    <!-- Content -->
    <template v-else-if="loaded">
      <KpiRow :tiles="kpiTiles" />

      <template v-if="viewMode === 'flow'">
        <AppSectionHeader
          v-if="hasAnyDueScheduled"
          :label="t('chores.dueToday')"
          :count="groups.due.length"
        />

        <AllDoneCard v-if="hasAnyDueScheduled && groups.due.length === 0" />

        <div v-else-if="groups.due.length" class="chores-view__group-list">
          <ChoreRow
            v-for="(chore, idx) in groups.due"
            :key="chore.id"
            :chore="chore"
            :at-top="idx === 0"
            :at-bottom="idx === groups.due.length - 1"
            :show-handle="true"
            v-on="rowHandlers"
          />
        </div>

        <template v-if="groups.upcoming.length">
          <AppSectionHeader :label="t('chores.upcoming')" :count="groups.upcoming.length" />
          <div class="chores-view__group-list">
            <ChoreRow
              v-for="(chore, idx) in groups.upcoming"
              :key="chore.id"
              :chore="chore"
              :at-top="idx === 0"
              :at-bottom="idx === groups.upcoming.length - 1"
              :show-handle="true"
              v-on="rowHandlers"
            />
          </div>
        </template>
      </template>

      <template v-else>
        <!-- cadence mode -->
        <template v-for="group in cadenceGroups" :key="group.key">
          <AppSectionHeader
            v-if="group.items.length"
            :label="group.label"
            :count="group.items.length"
          />
          <div v-if="group.items.length" class="chores-view__group-list">
            <ChoreRow
              v-for="(chore, idx) in group.items"
              :key="chore.id"
              :chore="chore"
              :at-top="idx === 0"
              :at-bottom="idx === group.items.length - 1"
              :show-handle="true"
              v-on="rowHandlers"
            />
          </div>
        </template>
      </template>

      <!-- Action bar -->
      <div class="chores-view__actions">
        <AppButton variant="primary" icon="plus" @click="showCreate = true">
          {{ t('chores.newChore') }}
        </AppButton>
        <AppButton variant="ghost" @click="toggleViewMode">
          {{ viewMode === 'flow' ? t('chores.byCadence') : t('chores.byFlow') }}
        </AppButton>
      </div>
    </template>

    <!-- Modals -->
    <CreateChoreModal v-model="showCreate" />
    <EditChoreModal v-model="showEdit" :chore="editingChore" />

    <AppConfirmDialog
      v-model="confirmDelete"
      :title="t('chores.deleteConfirmTitle')"
      :message="t('chores.deleteConfirmBody')"
      @confirm="performDelete"
    />
  </div>
</template>

<script>
/** ChoresView — Due-today / Upcoming groups (flow mode) or Daily/Weekly/Monthly (cadence mode). */
import { onMounted, computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChoresStore } from '@/stores/chores.store.js'
import AppScreenHeading from '@/components/ui/AppScreenHeading.vue'
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import KpiRow from '@/components/today/KpiRow.vue'
import ChoreRow from '@/components/chores/ChoreRow.vue'
import ChoresSkeleton from '@/components/chores/ChoresSkeleton.vue'
import ChoresEmpty from '@/components/chores/ChoresEmpty.vue'
import AllDoneCard from '@/components/chores/AllDoneCard.vue'
import CreateChoreModal from '@/components/chores/CreateChoreModal.vue'
import EditChoreModal from '@/components/chores/EditChoreModal.vue'
import { groupChoresForView, isDueOn, isSnoozedNow } from '@/utils/chores.js'

const VIEW_MODE_KEY = 'chores.viewMode'

export default {
  name: 'ChoresView',
  components: {
    AppScreenHeading,
    AppSectionHeader,
    AppButton,
    AppConfirmDialog,
    KpiRow,
    ChoreRow,
    ChoresSkeleton,
    ChoresEmpty,
    AllDoneCard,
    CreateChoreModal,
    EditChoreModal
  },
  setup() {
    // -- State --
    const store = useChoresStore()
    const { t } = useI18n()
    const loaded = ref(false)
    const showCreate = ref(false)
    const showEdit = ref(false)
    const editingChore = ref(null)
    const confirmDelete = ref(false)
    const pendingDeleteId = ref(null)
    const viewMode = ref(loadViewMode())

    // -- Computed --
    const allChores = computed(() => store.chores ?? [])
    const today = computed(() => new Date())
    const groups = computed(() => groupChoresForView(allChores.value, today.value))

    const cadenceGroups = computed(() => [
      {
        key: 'daily',
        label: t('chores.cadenceDaily'),
        items: allChores.value.filter(c => c.cadence.type === 'daily')
      },
      {
        key: 'weekly',
        label: t('chores.cadenceWeekly'),
        items: allChores.value.filter(c => c.cadence.type === 'weekly')
      },
      {
        key: 'monthly',
        label: t('chores.cadenceMonthly'),
        items: allChores.value.filter(c => c.cadence.type === 'monthly')
      }
    ])

    /** True when at least one chore would be due today (whether done or not). */
    const hasAnyDueScheduled = computed(() =>
      allChores.value.some(c => !isSnoozedNow(c, today.value) && isDueOn(c, today.value))
    )

    const kpiTiles = computed(() => {
      const dueToday = allChores.value.filter(
        c => !isSnoozedNow(c, today.value) && isDueOn(c, today.value)
      )
      const todayIso = new Date().toLocaleDateString('en-CA')
      const done = dueToday.filter(
        c => String(c.lastCompletedOn ?? '').slice(0, 10) === todayIso
      ).length
      const currentStreak = allChores.value.reduce((m, c) => Math.max(m, c.streak ?? 0), 0)
      const bestStreak = allChores.value.reduce((m, c) => Math.max(m, c.bestStreak ?? 0), 0)
      return [
        {
          key: 'today',
          label: t('chores.kpiToday'),
          value: `${done}/${dueToday.length}`,
          unit: t('chores.kpiTodayUnit')
        },
        {
          key: 'current',
          label: t('chores.kpiCurrent'),
          value: currentStreak,
          unit: t('chores.kpiCurrentUnit')
        },
        {
          key: 'best',
          label: t('chores.kpiBest'),
          value: bestStreak,
          unit: t('chores.kpiBestUnit')
        }
      ]
    })

    const rowHandlers = {
      complete: id => store.completeChore(id).catch(() => {}),
      snooze: onSnooze,
      'snooze-until': onSnoozeUntilRequest,
      'skip-next': id => store.skipNextChore(id).catch(() => {}),
      resume: id => store.resumeChore(id).catch(() => {}),
      edit: onEdit,
      delete: onDeleteRequest,
      'move-up': id => onMove(id, -1),
      'move-down': id => onMove(id, +1)
    }

    // -- Lifecycle --
    onMounted(async () => {
      await store.load()
      loaded.value = true
    })

    watch(
      () => store.loading,
      isLoading => {
        if (!isLoading) loaded.value = true
      }
    )

    return {
      store,
      t,
      loaded,
      allChores,
      groups,
      cadenceGroups,
      hasAnyDueScheduled,
      kpiTiles,
      viewMode,
      showCreate,
      showEdit,
      editingChore,
      confirmDelete,
      rowHandlers,
      toggleViewMode,
      performDelete
    }

    // -- Function definitions --

    function loadViewMode() {
      try {
        const v = localStorage.getItem(VIEW_MODE_KEY)
        return v === 'cadence' ? 'cadence' : 'flow'
      } catch {
        return 'flow'
      }
    }

    function persistViewMode(mode) {
      try {
        localStorage.setItem(VIEW_MODE_KEY, mode)
      } catch {
        /* ignore */
      }
    }

    function toggleViewMode() {
      viewMode.value = viewMode.value === 'flow' ? 'cadence' : 'flow'
      persistViewMode(viewMode.value)
    }

    function onSnooze({ id, until }) {
      store.snoozeChore(id, until).catch(() => {})
    }

    // Reserved hook for opening an inline SnoozeUntilPopover from the row.
    // Current iteration leaves the menu item dispatching to this hook; the
    // popover wiring is a follow-up.
    function onSnoozeUntilRequest(/* id */) {}

    function onEdit(id) {
      editingChore.value = allChores.value.find(c => c.id === id) ?? null
      showEdit.value = !!editingChore.value
    }

    function onDeleteRequest(id) {
      pendingDeleteId.value = id
      confirmDelete.value = true
    }

    async function performDelete() {
      if (!pendingDeleteId.value) return
      try {
        await store.deleteChore(pendingDeleteId.value)
      } catch {
        // toasted by store
      }
      pendingDeleteId.value = null
      confirmDelete.value = false
    }

    async function onMove(id, delta) {
      const list =
        viewMode.value === 'flow'
          ? groups.value.due.some(c => c.id === id)
            ? groups.value.due
            : groups.value.upcoming
          : (cadenceGroups.value.find(g => g.items.some(c => c.id === id))?.items ?? [])
      const idx = list.findIndex(c => c.id === id)
      if (idx < 0) return
      const next = idx + delta
      if (next < 0 || next >= list.length) return
      const reordered = [...list]
      const [moved] = reordered.splice(idx, 1)
      reordered.splice(next, 0, moved)
      try {
        await store.reorderChores(reordered.map(c => c.id))
      } catch {
        /* toasted by store */
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.chores-view {
  &__status {
    @apply flex items-center gap-2 text-[13px] text-muted;

    &--error {
      @apply text-bad;
    }
  }

  &__group-list {
    @apply rounded-md bg-paper-2 px-2.5 py-1 shadow-sm;
  }

  &__actions {
    @apply mt-7 flex flex-wrap gap-2.5;
  }
}
</style>
