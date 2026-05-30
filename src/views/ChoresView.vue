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
      <span>
        {{ store.error }}
      </span>

      <AppButton size="sm" variant="ghost" @click="store.load()">
        {{ t('common.retry') }}
      </AppButton>
    </div>

    <!-- Empty state (loaded, no chores) -->
    <ChoresEmpty v-else-if="loaded && allChores.length === 0" @create="showCreate = true" />

    <!-- Content -->
    <template v-else-if="loaded">
      <!-- Slim stat line — replaces the old triple KPI tile block -->
      <p class="chores-view__lede">
        <span class="chores-view__lede-part">
          {{ metaText.today }}
        </span>

        <span class="chores-view__lede-sep" aria-hidden="true">
          ·
        </span>

        <span class="chores-view__lede-part">
          {{ metaText.streak }}
        </span>

        <span class="chores-view__lede-sep" aria-hidden="true">
          ·
        </span>

        <span class="chores-view__lede-part">
          <em>
            {{ metaText.best }}
          </em>
        </span>
      </p>

      <template v-if="viewMode === 'flow'">
        <AppSectionHeader
          v-if="hasAnyDueScheduled"
          :label="t('chores.dueToday')"
          :count="groups.due.length"
        />

        <AllDoneCard v-if="hasAnyDueScheduled && groups.due.length === 0" />

        <AppCard v-else-if="dueList.length" class="chores-view__group-card">
          <draggable
            :list="dueList"
            item-key="id"
            :animation="180"
            filter="button, .chore-row__title, .checkbox"
            :prevent-on-filter="false"
            ghost-class="chore-row--ghost"
            @end="onReorderFlow"
          >
            <template #item="{ element: chore, index: idx }">
              <ChoreRow
                :chore="chore"
                :at-top="idx === 0"
                :at-bottom="idx === dueList.length - 1"
                v-on="rowHandlers"
              />
            </template>
          </draggable>
        </AppCard>

        <template v-if="upcomingList.length">
          <AppSectionHeader :label="t('chores.upcoming')" :count="upcomingList.length" />

          <AppCard class="chores-view__group-card">
            <draggable
              :list="upcomingList"
              item-key="id"
              :animation="180"
              filter="button, .chore-row__title, .chore-checkbox"
              :prevent-on-filter="false"
              ghost-class="chore-row--ghost"
              @end="onReorderFlow"
            >
              <template #item="{ element: chore, index: idx }">
                <ChoreRow
                  :chore="chore"
                  :at-top="idx === 0"
                  :at-bottom="idx === upcomingList.length - 1"
                  v-on="rowHandlers"
                />
              </template>
            </draggable>
          </AppCard>
        </template>
      </template>

      <template v-else>
        <!-- cadence mode -->
        <template v-for="group in cadenceGroups" :key="group.key">
          <AppSectionHeader
            v-if="cadenceLists[group.key].length"
            :label="group.label"
            :count="cadenceLists[group.key].length"
          />

          <AppCard v-if="cadenceLists[group.key].length" class="chores-view__group-card">
            <draggable
              :list="cadenceLists[group.key]"
              item-key="id"
              :animation="180"
              filter="button, .chore-row__title, .chore-checkbox"
              :prevent-on-filter="false"
              ghost-class="chore-row--ghost"
              @end="onReorderCadence"
            >
              <template #item="{ element: chore, index: idx }">
                <ChoreRow
                  :chore="chore"
                  :at-top="idx === 0"
                  :at-bottom="idx === cadenceLists[group.key].length - 1"
                  v-on="rowHandlers"
                />
              </template>
            </draggable>
          </AppCard>
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
import draggable from 'vuedraggable'
import { useChoresStore } from '@/stores/chores.store.js'
import AppScreenHeading from '@/components/ui/AppScreenHeading.vue'
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
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
    AppCard,
    AppConfirmDialog,
    ChoreRow,
    ChoresSkeleton,
    ChoresEmpty,
    AllDoneCard,
    CreateChoreModal,
    EditChoreModal,
    draggable
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
      },
      {
        key: 'once',
        label: t('chores.cadenceOnce'),
        items: allChores.value.filter(c => c.cadence.type === 'once')
      }
    ])

    /** True when at least one chore would be due today (whether done or not). */
    const hasAnyDueScheduled = computed(() =>
      allChores.value.some(c => !isSnoozedNow(c, today.value) && isDueOn(c, today.value))
    )

    /*
     * Drag-reorder needs mutable per-group lists for vuedraggable to splice
     * into. We mirror the computed groups into refs and keep them in sync
     * whenever the store reloads — that's also what bounces the visible
     * order back into agreement after a persist.
     */
    const dueList = ref([])
    const upcomingList = ref([])
    const cadenceLists = ref({ daily: [], weekly: [], monthly: [], once: [] })

    watch(
      groups,
      ({ due, upcoming }) => {
        dueList.value = [...due]
        upcomingList.value = [...upcoming]
      },
      { immediate: true }
    )

    watch(
      cadenceGroups,
      list => {
        const next = { daily: [], weekly: [], monthly: [], once: [] }
        for (const g of list) next[g.key] = [...g.items]
        cadenceLists.value = next
      },
      { immediate: true }
    )

    /**
     * Three short phrases shown under the heading — replaces the old fat
     * KPI tile row. Returns rendered strings so the template stays dumb.
     */
    const metaText = computed(() => {
      const dueToday = allChores.value.filter(
        c => !isSnoozedNow(c, today.value) && isDueOn(c, today.value)
      )

      const todayIso = new Date().toLocaleDateString('en-CA')

      const done = dueToday.filter(
        c => String(c.lastCompletedOn ?? '').slice(0, 10) === todayIso
      ).length

      const currentStreak = allChores.value.reduce((m, c) => Math.max(m, c.streak ?? 0), 0)
      const bestStreak = allChores.value.reduce((m, c) => Math.max(m, c.bestStreak ?? 0), 0)

      return {
        today: t('chores.metaToday', { done, total: dueToday.length }),
        streak:
          currentStreak === 1
            ? t('chores.metaStreakSingular')
            : t('chores.metaStreak', { count: currentStreak }),
        best: t('chores.metaBest', { count: bestStreak })
      }
    })

    const rowHandlers = {
      complete: id => store.completeChore(id).catch(() => {}),
      uncomplete: id => store.uncompleteChore(id).catch(() => {}),
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
      metaText,
      viewMode,
      showCreate,
      showEdit,
      editingChore,
      confirmDelete,
      rowHandlers,
      dueList,
      upcomingList,
      cadenceLists,
      onReorderFlow,
      onReorderCadence,
      toggleViewMode,
      performDelete
    }

    /*
     * Persist the new global order whenever the user drops a row in flow
     * mode. We compose the combined sequence (due → upcoming) so every
     * chore gets a fresh, gap-free order index — leaving gaps would let
     * the next sort by `order` re-shuffle the unaffected list.
     */
    async function onReorderFlow() {
      const combined = [...dueList.value, ...upcomingList.value]

      try {
        await store.reorderChores(combined.map(c => c.id))
      } catch {
        /* toasted by store */
      }
    }

    /** Cadence-mode variant — daily → weekly → monthly → once. */
    async function onReorderCadence() {
      const { daily, weekly, monthly, once } = cadenceLists.value
      const combined = [...daily, ...weekly, ...monthly, ...once]

      try {
        await store.reorderChores(combined.map(c => c.id))
      } catch {
        /* toasted by store */
      }
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

  &__lede {
    // Pull the stat strip up against the page heading so it reads as a
    // subtitle rather than a separate band. AppScreenHeading owns its own
    // bottom margin (mb-7); we negate part of it to tighten the gap.
    @apply -mt-4 mb-7 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-relaxed text-muted;
  }

  &__lede-part {
    @apply inline-flex items-center;

    em {
      @apply font-serif text-[14px] italic text-ink;
    }
  }

  &__lede-sep {
    @apply text-rule;
  }

  // Specificity-doubled selector so AppCard's `.card` padding can't win when
  // Vite happens to emit the child stylesheet after the parent's.
  &__group-card.chores-view__group-card {
    @apply gap-0 px-5 py-0;
  }

  &__actions {
    @apply mt-7 flex flex-wrap gap-2.5;
  }
}
</style>
