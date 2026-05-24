<template>
  <div>
    <ScreenHeading eyebrow="Workspaces · Chores" title="Small habits," emphasis="kept." />

    <div v-if="store.loading" class="chores-view__status">
      {{ t('common.loading') }}
    </div>

    <div v-else-if="store.error" class="chores-view__status chores-view__status--error">
      <span>
        {{ store.error }}
      </span>

      <Button size="sm" variant="ghost" @click="store.load()">
        {{ t('common.retry') }}
      </Button>
    </div>

    <template v-else>
      <template v-for="group in groups" :key="group.key">
        <SectionHeader v-if="group.items.length" :label="group.label" :count="group.items.length" />

        <div v-if="group.items.length" class="chores-view__group-list">
          <ChoreRow
            v-for="chore in group.items"
            :key="chore.id"
            :chore="chore"
            @complete="store.completeChore"
            @snooze="onSnooze"
            @skip-next="store.skipNextChore"
            @resume="store.resumeChore"
          />
        </div>
      </template>

      <div
        v-if="isEmpty"
        class="chores-view__empty"
      >
        {{ t('chores.emptyState') }}
      </div>

      <div class="chores-view__actions">
        <Button variant="primary" icon="plus" @click="showCreate = true">
          {{ t('chores.newChore') }}
        </Button>
      </div>
    </template>

    <CreateChoreModal v-model="showCreate" />
  </div>
</template>

<script>
/** ChoresView — recurring habit list grouped by cadence (daily, weekly, monthly). */
import { onMounted, computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChoresStore } from '@/stores/chores.store.js'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Button from '@/components/ui/Button.vue'
import ChoreRow from '@/components/chores/ChoreRow.vue'
import CreateChoreModal from '@/components/chores/CreateChoreModal.vue'

export default {
  name: 'ChoresView',
  components: { ScreenHeading, SectionHeader, Button, ChoreRow, CreateChoreModal },
  setup() {
    // -- State --
    const store = useChoresStore()
    const { t } = useI18n()
    /** True once the store has completed at least one load, preventing empty-state flash. */
    const loaded = ref(false)
    const showCreate = ref(false)

    // -- Computed --

    /** Chores grouped into daily, weekly, and monthly buckets, with labels from i18n (WEB-W4-02). */
    const groups = computed(() => {
      const chores = store.chores ?? []
      return [
        { key: 'daily', label: t('chores.cadenceDaily'), items: chores.filter((c) => c.cadence.type === 'daily') },
        { key: 'weekly', label: t('chores.cadenceWeekly'), items: chores.filter((c) => c.cadence.type === 'weekly') },
        { key: 'monthly', label: t('chores.cadenceMonthly'), items: chores.filter((c) => c.cadence.type === 'monthly') },
      ]
    })

    /** True only when loaded and all groups are empty. */
    const isEmpty = computed(() => loaded.value && !groups.value.some((g) => g.items.length))

    // -- Lifecycle --
    onMounted(async () => {
      await store.load()
      loaded.value = true
    })

    // Sync `loaded` with the store's loading flag (WEB-W4-24). Reset on
    // start, restore on finish — so a brief loading→done flicker (e.g. the
    // completeChore reload) doesn't leave `loaded` stuck at false between
    // the watch firing and the in-flight reload resolving.
    watch(
      () => store.loading,
      isLoading => {
        if (isLoading) loaded.value = false
        else loaded.value = true
      }
    )

    /** Translate ChoreRow's snooze event ({ id, until }) into the store call. */
    function onSnooze({ id, until }) {
      store.snoozeChore(id, until).catch(() => {})
    }

    return { store, groups, loaded, isEmpty, showCreate, t, onSnooze }
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

  &__empty {
    @apply mt-8 text-center text-[14px] text-muted;
  }

  &__actions {
    @apply mt-7 flex gap-2.5;
  }
}
</style>
