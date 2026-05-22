<template>
  <div>
    <RouterLink to="/projects" class="font-mono text-[12px] text-muted hover:text-ink">
      &larr; Projects
    </RouterLink>

    <div v-if="store.loading" class="mt-4 text-[13px] text-muted">
      Loading…
    </div>

    <div v-else-if="store.error" class="mt-4 text-[13px] text-bad">
      {{ store.error }}
    </div>

    <template v-else-if="project">
      <ScreenHeading :title="project.name" :emphasis="project.tag" />

      <div class="grid grid-cols-3 gap-4">
        <!-- Progress card -->
        <Card>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted">
            Progress
          </p>

          <p class="font-serif text-[36px] font-normal leading-none text-ink">
            {{ percent }}%
          </p>

          <ProgressBar :value="percent / 100" />
        </Card>

        <!-- Done / open card -->
        <Card>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted">
            Done · open
          </p>

          <p class="font-serif text-[36px] font-normal leading-none text-ink">
            {{ done }} · {{ open }}
          </p>
        </Card>

        <!-- Wren's read card -->
        <Card variant="accent">
          <p class="text-[11px] font-medium uppercase tracking-widest text-accent-ink opacity-70">
            Wren's read
          </p>

          <p class="font-serif text-[15px] italic leading-relaxed text-accent-ink">
            {{ project.nudge || project.blurb || 'No notes yet.' }}
          </p>
        </Card>
      </div>

      <p v-if="project.blurb" class="mt-6 font-serif text-[16px] italic leading-relaxed text-muted">
        {{ project.blurb }}
      </p>

      <template v-for="section in sections" :key="section.key">
        <SectionHeader :label="section.label" :count="section.tasks.length" />

        <div v-if="section.tasks.length" class="rounded-md bg-paper-2 px-2.5 py-1 shadow-sm">
          <div
            v-for="task in section.tasks"
            :key="task.id"
            class="flex items-center gap-3.5 rounded-lg px-2 py-3 transition-colors hover:bg-paper-3"
          >
            <Checkbox
              :model-value="task.done"
              @update:model-value="store.completeTask(task.id)"
            />

            <span
              class="min-w-0 flex-1 text-[14px]"
              :class="task.done ? 'text-muted line-through' : 'text-ink'"
            >
              {{ task.title }}
            </span>

            <Pill v-if="task.tag" variant="default">
              {{ task.tag }}
            </Pill>
          </div>
        </div>

        <p v-else class="mt-1 text-[13px] text-muted">
          No tasks here.
        </p>
      </template>

      <div class="mt-7 flex gap-2.5">
        <Button variant="primary">
          Add task
        </Button>

        <RouterLink
          :to="`/projects/${route.params.id}/board`"
          class="inline-flex h-9 items-center rounded-pill border border-rule-soft bg-paper-2 px-4 text-[13px] font-medium text-ink transition-colors hover:bg-paper-3 no-underline"
        >
          Switch to board view
        </RouterLink>

        <Button variant="ghost">
          Archive project
        </Button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useProjectsStore } from '@/stores/projects.store'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Pill from '@/components/ui/Pill.vue'
import Checkbox from '@/components/ui/Checkbox.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'

const route = useRoute()
const store = useProjectsStore()
onMounted(() => store.loadBoard(route.params.id))

const project = computed(() => store.board?.project ?? null)
const done = computed(() => project.value?.progress?.done ?? 0)
const total = computed(() => project.value?.progress?.total ?? 0)
const open = computed(() => total.value - done.value)
const percent = computed(() => project.value?.progress?.percent ?? 0)

const sections = computed(() => [
  { key: 'thisWeek', label: 'This week', tasks: store.board?.thisWeek ?? [] },
  { key: 'doing', label: 'Doing', tasks: store.board?.doing ?? [] },
  { key: 'backlog', label: 'Backlog', tasks: store.board?.backlog ?? [] },
  { key: 'done', label: 'Done', tasks: store.board?.done ?? [] },
])
</script>
