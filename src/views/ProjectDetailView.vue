<template>
  <div>
    <RouterLink to="/projects" class="project-detail-view__back-link">
      &larr; Projects
    </RouterLink>

    <div v-if="store.loadingBoard" class="project-detail-view__status project-detail-view__status--mt">
      Loading…
    </div>

    <div v-else-if="store.errorBoard" class="project-detail-view__status project-detail-view__status--mt project-detail-view__status--error">
      {{ store.errorBoard }}
    </div>

    <template v-else-if="project">
      <ScreenHeading :title="project.name" :emphasis="project.tag" />

      <div class="project-detail-view__stats-grid">
        <!-- Progress card -->
        <Card>
          <p class="project-detail-view__card-label">
            Progress
          </p>

          <p class="project-detail-view__card-value">
            {{ percent }}%
          </p>

          <ProgressBar :value="percent / 100" />
        </Card>

        <!-- Done / open card -->
        <Card>
          <p class="project-detail-view__card-label">
            Done · open
          </p>

          <p class="project-detail-view__card-value">
            {{ done }} · {{ open }}
          </p>
        </Card>

        <!-- Wren's read card -->
        <Card variant="accent">
          <p class="project-detail-view__card-label project-detail-view__card-label--accent">
            Wren's read
          </p>

          <p class="project-detail-view__wren-text">
            {{ project.nudge || project.blurb || 'No notes yet.' }}
          </p>
        </Card>
      </div>

      <p v-if="project.blurb" class="project-detail-view__blurb">
        {{ project.blurb }}
      </p>

      <template v-for="section in sections" :key="section.key">
        <SectionHeader :label="section.label" :count="section.tasks.length" />

        <div v-if="section.tasks.length" class="project-detail-view__task-list">
          <div
            v-for="task in section.tasks"
            :key="task.id"
            class="project-detail-view__task-item"
          >
            <Checkbox
              :model-value="task.done"
              @update:model-value="store.completeTask(task.id)"
            />

            <span
              class="project-detail-view__task-title"
              :class="task.done ? 'project-detail-view__task-title--done' : 'project-detail-view__task-title--open'"
            >
              {{ task.title }}
            </span>

            <Pill v-if="task.tag" variant="default">
              {{ task.tag }}
            </Pill>
          </div>
        </div>

        <p v-else class="project-detail-view__section-empty">
          No tasks here.
        </p>
      </template>

      <div class="project-detail-view__actions">
        <Button variant="primary">
          Add task
        </Button>

        <RouterLink
          :to="`/projects/${route.params.id}/board`"
          class="project-detail-view__board-link"
        >
          Switch to board view
        </RouterLink>

        <Button variant="ghost">
          Archive project
        </Button>
      </div>
    </template>

    <div v-else class="project-detail-view__status project-detail-view__status--mt">
      Project not found.
      <RouterLink to="/projects" class="project-detail-view__back-link">
        Back to projects
      </RouterLink>
    </div>
  </div>
</template>

<script>
/** ProjectDetailView — project overview with progress stats, task sections, and board navigation. */
import { onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useProjectsStore } from '@/stores/projects.store.js'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Pill from '@/components/ui/Pill.vue'
import Checkbox from '@/components/ui/Checkbox.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'

export default {
  name: 'ProjectDetailView',
  components: { RouterLink, ScreenHeading, SectionHeader, Button, Card, Pill, Checkbox, ProgressBar },
  setup() {
    // -- State --
    const route = useRoute()
    const store = useProjectsStore()

    // -- Computed --

    /** The project from the loaded board, or null. */
    const project = computed(() => store.board?.project ?? null)

    /** Number of completed tasks. */
    const done = computed(() => project.value?.progress?.done ?? 0)

    /** Total task count. */
    const total = computed(() => project.value?.progress?.total ?? 0)

    /** Number of open (incomplete) tasks. */
    const open = computed(() => total.value - done.value)

    /** Completion percentage (0–100). */
    const percent = computed(() => project.value?.progress?.percent ?? 0)

    /** Task sections ordered for display. */
    const sections = computed(() => [
      { key: 'thisWeek', label: 'This week', tasks: store.board?.thisWeek ?? [] },
      { key: 'doing', label: 'Doing', tasks: store.board?.doing ?? [] },
      { key: 'backlog', label: 'Backlog', tasks: store.board?.backlog ?? [] },
      { key: 'done', label: 'Done', tasks: store.board?.done ?? [] },
    ])

    // -- Lifecycle --
    onMounted(() => store.loadBoard(route.params.id))

    return { route, store, project, done, open, percent, sections }
  }
}
</script>

<style lang="scss" scoped>
.project-detail-view {
  &__back-link {
    @apply font-mono text-[12px] text-muted hover:text-ink;
  }

  &__status {
    @apply text-[13px] text-muted;

    &--mt {
      @apply mt-4;
    }

    &--error {
      @apply text-bad;
    }
  }

  &__stats-grid {
    @apply grid grid-cols-3 gap-4;
  }

  &__card-label {
    @apply text-[11px] font-medium uppercase tracking-widest text-muted;

    &--accent {
      @apply text-accent-ink opacity-70;
    }
  }

  &__card-value {
    @apply font-serif text-[36px] font-normal leading-none text-ink;
  }

  &__wren-text {
    @apply font-serif text-[15px] italic leading-relaxed text-accent-ink;
  }

  &__blurb {
    @apply mt-6 font-serif text-[16px] italic leading-relaxed text-muted;
  }

  &__task-list {
    @apply rounded-md bg-paper-2 px-2.5 py-1 shadow-sm;
  }

  &__task-item {
    @apply flex items-center gap-3.5 rounded-lg px-2 py-3 transition-colors hover:bg-paper-3;
  }

  &__task-title {
    @apply min-w-0 flex-1 text-[14px];

    &--done {
      @apply text-muted line-through;
    }

    &--open {
      @apply text-ink;
    }
  }

  &__section-empty {
    @apply mt-1 text-[13px] text-muted;
  }

  &__actions {
    @apply mt-7 flex gap-2.5;
  }

  &__board-link {
    @apply inline-flex h-9 items-center rounded-pill border border-rule-soft bg-paper-2 px-4 text-[13px] font-medium text-ink transition-colors hover:bg-paper-3 no-underline;
  }
}
</style>
