<template>
  <div>
    <ScreenHeading
      eyebrow="Looking back · Inbox"
      title="Triage,"
      emphasis="don't think."
    />

    <div v-if="store.loading" class="inbox-view__status">
      {{ t('common.loading') }}
    </div>

    <div v-else-if="store.error" class="inbox-view__status inbox-view__status--error">
      {{ store.error }}
    </div>

    <!-- Capture card -->
    <Card>
      <div class="inbox-view__capture-row">
        <TextField
          v-model="captureText"
          :label="t('inbox.captureLabel')"
          :placeholder="t('inbox.capturePlaceholder')"
          class="inbox-view__capture-field"
          @keydown.enter="capture"
        />

        <Button
          variant="primary"
          :disabled="!captureText.trim() || capturing"
          @click="capture"
        >
          {{ t('inbox.captureCta') }}
        </Button>
      </div>
    </Card>

    <!-- To triage list -->
    <SectionHeader :label="t('inbox.toTriageSection')" :count="store.items.length" />

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

      <Button
        size="sm"
        variant="primary"
        :disabled="!projectTarget || store.saving"
        @click="bulkSendToProject"
      >
        {{ t('inbox.bulkConvert') }}
      </Button>

      <Button
        size="sm"
        variant="ghost"
        :disabled="store.saving"
        @click="bulkScheduleToday"
      >
        {{ t('inbox.bulkScheduleToday') }}
      </Button>

      <Button
        size="sm"
        variant="ghost"
        :disabled="store.saving"
        @click="bulkTriage"
      >
        {{ t('inbox.bulkTriage') }}
      </Button>

      <Button
        size="sm"
        variant="ghost"
        :disabled="store.saving"
        @click="bulkDelete"
      >
        {{ t('inbox.bulkDelete') }}
      </Button>

      <Button size="sm" variant="ghost" @click="clearSelection">
        {{ t('inbox.bulkClear') }}
      </Button>
    </div>

    <div v-if="store.items.length === 0 && !store.loading" class="inbox-view__status">
      {{ t('inbox.emptyState') }}
    </div>

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
        v-for="(item, idx) in store.items"
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

        <span class="inbox-view__index">
          {{ String(idx + 1).padStart(2, '0') }}
        </span>

        <div class="inbox-view__content">
          <span class="inbox-view__text">
            {{ item.text }}
          </span>

          <span class="inbox-view__meta">
            {{ item.source }} · {{ relativeTime(item.capturedAt) }}
          </span>
        </div>

        <Button size="sm" variant="ghost" @click="store.triage(item.id)">
          {{ t('inbox.triageCta') }}
        </Button>
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
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import TextField from '@/components/ui/TextField.vue'

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default {
  name: 'InboxView',
  components: { ScreenHeading, SectionHeader, Button, Card, TextField },
  setup() {
    const { t } = useI18n()
    const store = useInboxStore()
    const projectsStore = useProjectsStore()
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

    function toggle(id) {
      const set = selectedSet.value
      if (set.has(id)) {
        selectedIds.value = selectedIds.value.filter(x => x !== id)
      } else {
        selectedIds.value = [...selectedIds.value, id]
      }
    }

    function toggleSelectAll() {
      if (allSelected.value) {
        selectedIds.value = []
      } else {
        selectedIds.value = store.items.map(i => i.id)
      }
    }

    function clearSelection() {
      selectedIds.value = []
      projectTarget.value = ''
    }

    async function bulkTriage() {
      try {
        await store.triageMany(selectedIds.value)
        clearSelection()
      } catch {
        // Toast surfaced by the store.
      }
    }

    async function bulkDelete() {
      try {
        await store.deleteMany(selectedIds.value)
        clearSelection()
      } catch {
        // Toast surfaced.
      }
    }

    async function bulkSendToProject() {
      if (!projectTarget.value) return
      try {
        await store.convertToTasks(selectedIds.value, { projectId: projectTarget.value })
        clearSelection()
      } catch {
        // Toast surfaced.
      }
    }

    async function bulkScheduleToday() {
      try {
        await store.convertToTasks(selectedIds.value, { scheduledDate: todayIso() })
        clearSelection()
      } catch {
        // Toast surfaced.
      }
    }

    async function capture() {
      if (!captureText.value.trim()) return
      capturing.value = true
      try {
        await store.capture(captureText.value.trim())
        captureText.value = ''
      } finally {
        capturing.value = false
      }
    }

    function relativeTime(dateStr) {
      if (!dateStr) return ''
      const now = Date.now()
      const then = new Date(dateStr).getTime()
      const diffMs = now - then
      const diffMins = Math.floor(diffMs / 60000)
      if (diffMins < 1) return t('inbox.relJustNow')
      if (diffMins < 60) return t('inbox.relMinutesAgo', { count: diffMins })
      const diffHrs = Math.floor(diffMins / 60)
      if (diffHrs < 24) return t('inbox.relHoursAgo', { count: diffHrs })
      const diffDays = Math.floor(diffHrs / 24)
      return t('inbox.relDaysAgo', { count: diffDays })
    }

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
      relativeTime
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

  &__capture-label {
    @apply font-mono text-[10px] uppercase tracking-[0.12em] text-muted;
  }

  &__capture-row {
    @apply flex gap-2.5;
  }

  &__capture-field {
    @apply flex-1;
  }

  &__bulk-bar {
    @apply sticky top-0 z-10 mb-2 flex flex-wrap items-center gap-2 rounded-md border border-rule-soft bg-paper p-2 shadow-sm;
  }

  &__bulk-count {
    @apply font-mono text-[11px] text-muted;
  }

  &__project-select {
    @apply rounded-md border border-rule-soft bg-paper px-2 py-1 text-[13px] text-ink;
  }

  &__list {
    @apply rounded-md bg-paper-2 px-2.5 py-1 shadow-sm;
  }

  &__list-header {
    @apply flex items-center gap-2 border-b border-rule-soft py-2;
  }

  &__select-all,
  &__row-check {
    @apply h-4 w-4 accent-accent;
  }

  &__select-all-label {
    @apply text-[12px] text-muted;
  }

  &__list-item {
    @apply flex items-center gap-3 border-b border-rule-soft py-3.5 last:border-0;
  }

  &__index {
    @apply w-6 shrink-0 font-mono text-[12px] text-muted;
  }

  &__content {
    @apply flex flex-1 flex-col gap-0.5 min-w-0;
  }

  &__text {
    @apply truncate text-[14px] text-ink;
  }

  &__meta {
    @apply font-mono text-[11px] text-muted;
  }
}
</style>
