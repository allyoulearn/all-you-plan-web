<template>
  <div>
    <ScreenHeading eyebrow="Workspaces · Chores" title="Small habits," emphasis="kept." />

    <div v-if="store.loading" class="text-[13px] text-muted">
      Loading…
    </div>

    <div v-else-if="store.error" class="text-[13px] text-bad">
      {{ store.error }}
    </div>

    <template v-else>
      <template v-for="group in groups" :key="group.label">
        <SectionHeader v-if="group.items.length" :label="group.label" :count="group.items.length" />

        <div v-if="group.items.length" class="rounded-md bg-paper-2 px-2.5 py-1 shadow-sm">
          <ChoreRow
            v-for="chore in group.items"
            :key="chore.id"
            :chore="chore"
            @complete="store.completeChore"
          />
        </div>
      </template>

      <div
        v-if="!groups.some((g) => g.items.length)"
        class="mt-8 text-center text-[14px] text-muted"
      >
        No chores yet. Add your first recurring habit below.
      </div>

      <div class="mt-7 flex gap-2.5">
        <Button variant="primary">
          New chore
        </Button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useChoresStore } from '@/stores/chores.store'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Button from '@/components/ui/Button.vue'
import ChoreRow from '@/components/chores/ChoreRow.vue'

const store = useChoresStore()
onMounted(() => store.load())

const groups = computed(() => {
  const chores = store.chores ?? []
  return [
    { label: 'Daily', items: chores.filter((c) => c.cadence.type === 'daily') },
    { label: 'Weekly', items: chores.filter((c) => c.cadence.type === 'weekly') },
    { label: 'Monthly', items: chores.filter((c) => c.cadence.type === 'monthly') },
  ]
})
</script>
