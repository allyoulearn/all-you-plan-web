<template>
  <div>
    <AppScreenHeading
      :eyebrow="`${t('nav.lookingBack')} · ${t('nav.itemInbox')}`"
      :title="t('inbox.headingPrefix')"
      :emphasis="t('inbox.headingEmphasis')"
    />

    <AppSkeleton
      v-if="store.loading"
      :rows="4"
      :aria-label="t('common.loading')"
    />

    <AppErrorState
      v-else-if="store.error"
      :message="store.error || t('common.loadError')"
      :retry-label="t('common.retry')"
      class="inbox-view__status--error"
      @retry="store.load()"
    />

    <!-- Capture bar — single horizontal strip. Dropped the AppCard wrapper
         and the redundant "Capture" label (the button right next to the
         input already labels the action, and the screen heading sets the
         context). Leading icon adds visual weight without another label. -->
    <form class="inbox-view__capture" @submit.prevent="capture">
      <label class="inbox-view__capture-input">
        <AppIcon
          name="plus"
          :size="16"
          class="inbox-view__capture-icon"
          aria-hidden="true"
        />

        <input
          v-model="captureText"
          type="text"
          :placeholder="t('inbox.capturePlaceholder')"
          :aria-label="t('inbox.captureLabel')"
        />
      </label>

      <AppButton
        type="submit"
        variant="primary"
        size="sm"
        :disabled="!captureText.trim() || capturing"
      >
        {{ t('inbox.captureCta') }}
      </AppButton>
    </form>

    <!-- To triage list -->
    <AppSectionHeader :label="t('inbox.toTriageSection')" :count="store.items.length" />

    <!-- Bulk action bar — appears when ≥1 item is selected -->
    <div v-if="selectedIds.length" class="inbox-view__bulk-bar">
      <span class="inbox-view__bulk-count">
        {{ t('inbox.selectedCount', { count: selectedIds.length }) }}
      </span>

      <select v-model="projectTarget" class="inbox-view__project-select">
        <option value="">
          {{ t('inbox.bulkSendToProject') }}
        </option>

        <option v-for="p in projectsStore.projects" :key="p.id" :value="p.id">
          {{ p.name }}
        </option>
      </select>

      <AppButton
        size="sm"
        variant="primary"
        :disabled="!projectTarget || store.saving"
        @click="bulkSendToProject"
      >
        {{ t('inbox.bulkConvert') }}
      </AppButton>

      <AppButton
        size="sm"
        variant="ghost"
        :disabled="store.saving"
        @click="bulkScheduleToday"
      >
        {{ t('inbox.bulkScheduleToday') }}
      </AppButton>

      <AppButton
        size="sm"
        variant="ghost"
        :disabled="store.saving"
        @click="bulkTriage"
      >
        {{ t('inbox.bulkTriage') }}
      </AppButton>

      <AppButton
        size="sm"
        variant="ghost"
        :disabled="store.saving"
        @click="bulkDelete"
      >
        {{ t('inbox.bulkDelete') }}
      </AppButton>

      <AppButton size="sm" variant="ghost" @click="clearSelection">
        {{ t('inbox.bulkClear') }}
      </AppButton>
    </div>

    <AppEmptyState
      v-if="store.items.length === 0 && !store.loading"
      icon="inbox"
      :title="t('inbox.emptyState')"
    />

    <div v-else class="inbox-view__list">
      <header v-if="store.items.length" class="inbox-view__list-header">
        <input
          type="checkbox"
          class="inbox-view__select-all"
          :checked="allSelected"
          :indeterminate.prop="someSelected && !allSelected"
          :aria-label="t('inbox.selectAll')"
          @change="toggleSelectAll"
        >

        <span class="inbox-view__select-all-label">
          {{ allSelected ? t('inbox.unselectAll') : t('inbox.selectAll') }}
        </span>
      </header>

      <div
        v-for="item in store.items"
        :key="item.id"
        class="inbox-view__list-item"
      >
        <input
          type="checkbox"
          :checked="selectedSet.has(item.id)"
          class="inbox-view__row-check"
          :aria-label="t('inbox.selectItem')"
          @change="toggle(item.id)"
        >

        <div class="inbox-view__content">
          <span class="inbox-view__text-row">
            <span class="inbox-view__text">
              {{ item.text }}
            </span>

            <WrenOriginBadge ref-type="inbox_item" :ref-id="item.id" />
          </span>

          <span class="inbox-view__meta">
            <span :class="['inbox-view__source', `inbox-view__source--${item.source}`]">
              {{ item.source }}
            </span>

            <span class="inbox-view__time">
              {{ relativeTime(item.capturedAt) }}
            </span>
          </span>
        </div>

        <button
          type="button"
          class="inbox-view__triage-btn"
          :title="t('inbox.triageCta')"
          :aria-label="t('inbox.triageCta')"
          @click="onTriage(item.id)"
        >
          <AppIcon name="archive" :size="14" aria-hidden="true" />

          <span>
            {{ t('inbox.triageCta') }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * InboxView — quick-capture panel with a running triage list. Each row now
 * carries a checkbox so the user can multi-select; the bulk bar surfaces
 * Send-to-project, Schedule-today, Triage, and Delete actions. Selection
 * state stays in the view (not the store) because no other view needs it.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useInboxStore } from '@/stores/inbox.store.js'
import { useProjectsStore } from '@/stores/projects.store.js'
import { useRelativeTime } from '@/composables/useRelativeTime.js'
import AppScreenHeading from '@/components/ui/AppScreenHeading.vue'
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import WrenOriginBadge from '@/components/wren/WrenOriginBadge.vue'
import { captureException } from '@/utils/sentry.js'
import { localISOToday } from '@/utils/date.js'

export default {
  name: 'InboxView',
  components: {
    AppScreenHeading,
    AppSectionHeader,
    AppButton,
    AppIcon,
    AppSkeleton,
    AppErrorState,
    AppEmptyState,
    WrenOriginBadge
  },
  setup() {
    const { t } = useI18n()
    const store = useInboxStore()
    const projectsStore = useProjectsStore()
    const { relativeTime } = useRelativeTime('inbox')
    const captureText = ref('')
    const capturing = ref(false)
    const selectedIds = ref([])
    const projectTarget = ref('')

    const selectedSet = computed(() => new Set(selectedIds.value))

    const allSelected = computed(
      () => store.items.length > 0 && selectedIds.value.length === store.items.length
    )

    const someSelected = computed(() => selectedIds.value.length > 0)

    onMounted(() => {
      store.load()
      // Bring the projects list in so the "Send to project" picker has data.
      projectsStore.loadProjects()
    })

    // Drop any stale selections when the items list shifts (e.g. after a
    // successful bulk action that triaged the selected rows away).
    watch(
      () => store.items,
      items => {
        const ids = new Set(items.map(i => i.id))
        selectedIds.value = selectedIds.value.filter(id => ids.has(id))
      },
      { deep: false }
    )

    return {
      t,
      store,
      projectsStore,
      captureText,
      capturing,
      selectedIds,
      selectedSet,
      allSelected,
      someSelected,
      projectTarget,
      toggle,
      toggleSelectAll,
      clearSelection,
      bulkTriage,
      bulkDelete,
      bulkSendToProject,
      bulkScheduleToday,
      capture,
      onTriage,
      relativeTime
    }

    // -- Function definitions --

    /**
     * Triage a single inbox row. The store toasts + re-throws on failure;
     * catch the rejection so the click handler can't leak an unhandled
     * promise, and report it to Sentry.
     * @param {string} id
     */
    function onTriage(id) {
      // Promise.resolve tolerates a non-promise return (e.g. a test spy).
      Promise.resolve(store.triage(id)).catch(captureException)
    }

    /**
     * Toggle selection for a single inbox item id.
     * @param {string} id
     */
    function toggle(id) {
      const set = selectedSet.value

      if (set.has(id)) {
        selectedIds.value = selectedIds.value.filter(x => x !== id)
      } else {
        selectedIds.value = [...selectedIds.value, id]
      }
    }

    /** Toggle between "select all visible items" and "clear all". */
    function toggleSelectAll() {
      if (allSelected.value) {
        selectedIds.value = []
      } else {
        selectedIds.value = store.items.map(i => i.id)
      }
    }

    /** Reset the bulk-action selection and the project picker. */
    function clearSelection() {
      selectedIds.value = []
      projectTarget.value = ''
    }

    /** Triage every selected inbox item and clear the selection on success. */
    async function bulkTriage() {
      try {
        await store.triageMany(selectedIds.value)
        clearSelection()
      } catch {
        // Toast surfaced by the store.
      }
    }

    /** Delete every selected inbox item and clear the selection on success. */
    async function bulkDelete() {
      try {
        await store.deleteMany(selectedIds.value)
        clearSelection()
      } catch {
        // Toast surfaced.
      }
    }

    /** Convert every selected inbox item into tasks on the chosen project. */
    async function bulkSendToProject() {
      if (!projectTarget.value) return

      try {
        await store.convertToTasks(selectedIds.value, { projectId: projectTarget.value })
        clearSelection()
      } catch {
        // Toast surfaced.
      }
    }

    /** Convert every selected inbox item into tasks scheduled for today. */
    async function bulkScheduleToday() {
      try {
        await store.convertToTasks(selectedIds.value, { scheduledDate: localISOToday() })
        clearSelection()
      } catch {
        // Toast surfaced.
      }
    }

    /** Submit the quick-capture field and reset it on success. */
    async function capture() {
      if (!captureText.value.trim()) return
      capturing.value = true

      try {
        await store.capture(captureText.value.trim())
        captureText.value = ''
      } catch (e) {
        // Toasted by the store; report and keep the draft for retry.
        captureException(e)
      } finally {
        capturing.value = false
      }
    }

  }
}
</script>

<style lang="scss" scoped>
.inbox-view {
  &__status {
    @apply text-[13px] text-muted;

    &--error {
      @apply text-bad;
    }
  }

  // -- Capture bar --------------------------------------------------------

  &__capture {
    @apply mb-6 flex items-center gap-2;
  }

  &__capture-input {
    @apply flex flex-1 items-center gap-2.5 rounded-pill border border-rule-soft bg-paper-2 px-4 py-2.5 transition-colors;

    &:focus-within {
      border-color: var(--ink);
    }

    input {
      @apply min-w-0 flex-1 bg-transparent text-[14px] outline-none;
      color: var(--ink);

      &::placeholder {
        color: var(--muted);
      }
    }
  }

  &__capture-icon {
    color: var(--muted);
  }

  // -- Bulk action bar ----------------------------------------------------

  &__bulk-bar {
    @apply sticky top-0 z-10 mb-2 flex flex-wrap items-center gap-2 rounded-md border border-rule-soft bg-paper p-2 shadow-sm;
  }

  &__bulk-count {
    @apply font-mono text-[11px] text-muted;
  }

  &__project-select {
    @apply rounded-md border border-rule-soft bg-paper px-2 py-1 text-[13px] text-ink;
  }

  // -- List ---------------------------------------------------------------

  &__list {
    @apply overflow-hidden rounded-lg border border-rule-soft bg-paper-2;
  }

  &__list-header {
    @apply flex items-center gap-2 border-b border-rule-soft px-4 py-2.5;
  }

  &__select-all,
  &__row-check {
    @apply h-4 w-4 cursor-pointer accent-accent;
  }

  &__select-all-label {
    @apply text-[12px] text-muted;
  }

  &__list-item {
    @apply flex items-center gap-3 border-b border-rule-soft px-4 py-2.5 transition-colors last:border-0;

    &:hover {
      background: color-mix(in oklab, var(--ink) 4%, transparent);
    }
  }

  &__content {
    @apply flex min-w-0 flex-1 flex-col gap-0.5;
  }

  &__text-row {
    @apply flex min-w-0 items-center gap-1.5;
  }

  &__text {
    @apply truncate text-[14px];
    color: var(--ink);
  }

  &__meta {
    @apply flex items-center gap-2;
  }

  &__source {
    @apply inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider;
    background: var(--paper-3);
    color: var(--muted);

    // Voice-captured items get a subtle accent tint so the source reads at a
    // glance — capture (typed) stays muted, siri / share / etc. stand out.
    &--siri {
      background: color-mix(in oklab, var(--accent, var(--ink)) 18%, transparent);
      color: var(--ink);
    }
  }

  &__time {
    @apply font-mono text-[11px];
    color: var(--muted);
  }

  &__triage-btn {
    @apply inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-pill border border-rule-soft px-2.5 py-1 text-[12px] transition-colors;
    color: var(--muted);

    &:hover {
      border-color: var(--ink);
      color: var(--ink);
    }
  }
}
</style>
