<script setup>
import { onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useProjectsStore } from '@/stores/projects.store'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import KanbanCard from '@/components/projects/KanbanCard.vue'

const route = useRoute()
const store = useProjectsStore()
onMounted(() => store.loadBoard(route.params.id))

const project = computed(() => store.board?.project ?? null)

const columns = computed(() => [
  { key: 'backlog', label: 'Backlog', tasks: store.board?.backlog ?? [] },
  { key: 'thisWeek', label: 'This week', tasks: store.board?.thisWeek ?? [] },
  { key: 'doing', label: 'Doing', tasks: store.board?.doing ?? [] },
  { key: 'done', label: 'Done', tasks: store.board?.done ?? [] },
])
</script>

<template>
  <div>
    <RouterLink
      v-if="project"
      :to="`/projects/${route.params.id}`"
      class="font-mono text-[12px] text-muted hover:text-ink"
    >
      &larr; {{ project.name }}
    </RouterLink>

    <div v-if="store.loading" class="mt-4 text-[13px] text-muted">Loading…</div>
    <div v-else-if="store.error" class="mt-4 text-[13px] text-bad">{{ store.error }}</div>

    <template v-else-if="project">
      <ScreenHeading :title="project.name" emphasis="by status." />

      <div class="grid grid-cols-4 gap-3.5">
        <div
          v-for="col in columns"
          :key="col.key"
          class="flex flex-col gap-2 rounded-md bg-paper-2 p-3"
        >
          <div class="mb-1 flex items-baseline gap-2">
            <span class="text-[12px] font-medium text-ink">{{ col.label }}</span>
            <span class="font-mono text-[11px] text-muted">[{{ col.tasks.length }}]</span>
          </div>
          <KanbanCard
            v-for="task in col.tasks"
            :key="task.id"
            :task="task"
            @complete="store.completeTask"
          />
          <p v-if="!col.tasks.length" class="text-[12px] text-muted">Empty</p>
        </div>
      </div>
    </template>
  </div>
</template>
