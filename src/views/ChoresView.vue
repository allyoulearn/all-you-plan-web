<template>
  <div>
    <ScreenHeading eyebrow="Workspaces · Chores" title="Small habits," emphasis="kept." />

    <div v-if="store.loading" class="chores-view__status">
      Loading…
    </div>

    <div v-else-if="store.error" class="chores-view__status chores-view__status--error">
      {{ store.error }}
    </div>

    <template v-else>
      <template v-for="group in groups" :key="group.label">
        <SectionHeader v-if="group.items.length" :label="group.label" :count="group.items.length" />

        <div v-if="group.items.length" class="chores-view__group-list">
          <ChoreRow
            v-for="chore in group.items"
            :key="chore.id"
            :chore="chore"
            @complete="store.completeChore"
          />
        </div>
      </template>

      <div
        v-if="isEmpty"
        class="chores-view__empty"
      >
        No chores yet. Add your first recurring habit below.
      </div>

      <div class="chores-view__actions">
        <Button variant="primary">
          New chore
        </Button>
      </div>
    </template>
  </div>
</template>

<script>
/** ChoresView — recurring habit list grouped by cadence (daily, weekly, monthly). */
import { onMounted, computed, ref, watch } from 'vue'
import { useChoresStore } from '@/stores/chores.store.js'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Button from '@/components/ui/Button.vue'
import ChoreRow from '@/components/chores/ChoreRow.vue'

export default {
  name: 'ChoresView',
  components: { ScreenHeading, SectionHeader, Button, ChoreRow },
  setup() {
    // -- State --
    const store = useChoresStore()
    /** True once the store has completed at least one load, preventing empty-state flash. */
    const loaded = ref(false)

    // -- Computed --

    /** Chores grouped into daily, weekly, and monthly buckets. */
    const groups = computed(() => {
      const chores = store.chores ?? []
      return [
        { label: 'Daily', items: chores.filter((c) => c.cadence.type === 'daily') },
        { label: 'Weekly', items: chores.filter((c) => c.cadence.type === 'weekly') },
        { label: 'Monthly', items: chores.filter((c) => c.cadence.type === 'monthly') },
      ]
    })

    /** True only when loaded and all groups are empty. */
    const isEmpty = computed(() => loaded.value && !groups.value.some((g) => g.items.length))

    // -- Lifecycle --
    onMounted(async () => {
      await store.load()
      loaded.value = true
    })

    // Reset loaded if the store starts a fresh load (e.g. after completeChore reload)
    watch(() => store.loading, (isLoading) => {
      if (isLoading) loaded.value = false
    })

    return { store, groups, loaded, isEmpty }
  }
}
</script>

<style lang="scss" scoped>
.chores-view {
  &__status {
    @apply text-[13px] text-muted;

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
