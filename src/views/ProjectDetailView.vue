<template>
  <div>
    <RouterLink to="/projects" class="project-detail-view__back-link">
      <AppIcon name="arrow-left" :size="14" />
      {{ t('projects.backToProjectsText') }}
    </RouterLink>

    <div v-if="store.loadingBoard" class="project-detail-view__status project-detail-view__status--mt">
      {{ t('common.loading') }}
    </div>

    <div v-else-if="store.errorBoard" class="project-detail-view__status project-detail-view__status--mt project-detail-view__status--error">
      {{ store.errorBoard }}
    </div>

    <template v-else-if="project">
      <AppScreenHeading :title="project.name" :emphasis="project.tag" />

      <div class="project-detail-view__stats-grid">
        <!-- Progress card -->
        <AppCard>
          <p class="project-detail-view__card-label">
            {{ t('projects.progressLabel') }}
          </p>

          <p class="project-detail-view__card-value">
            {{ percent }}%
          </p>

          <AppProgressBar :value="percent / 100" />
        </AppCard>

        <!-- Done / open card -->
        <AppCard>
          <p class="project-detail-view__card-label">
            {{ t('projects.doneOpenLabel') }}
          </p>

          <p class="project-detail-view__card-value">
            {{ done }} · {{ open }}
          </p>
        </AppCard>

        <!-- Wren's read card -->
        <AppCard variant="accent">
          <p class="project-detail-view__card-label project-detail-view__card-label--accent">
            {{ t('projects.wrenReadLabel') }}
          </p>

          <p class="project-detail-view__wren-text">
            {{ project.nudge || project.blurb || t('projects.noNotesYet') }}
          </p>
        </AppCard>
      </div>

      <p v-if="project.blurb" class="project-detail-view__blurb">
        {{ project.blurb }}
      </p>

      <template v-for="section in sections" :key="section.key">
        <AppSectionHeader :label="section.label" :count="section.tasks.length" />

        <TransitionGroup
          v-if="section.tasks.length"
          name="task-complete"
          tag="div"
          class="project-detail-view__task-list"
        >
          <div
            v-for="task in section.tasks"
            :key="task.id"
            class="project-detail-view__task-item"
          >
            <AppCheckbox
              :model-value="task.done"
              @update:model-value="store.completeTask(task.id)"
            />

            <span
              class="project-detail-view__task-title"
              :class="task.done ? 'project-detail-view__task-title--done' : 'project-detail-view__task-title--open'"
            >
              {{ task.title }}
            </span>

            <AppPill v-if="task.tag" variant="default">
              {{ task.tag }}
            </AppPill>
          </div>
        </TransitionGroup>

        <p v-else class="project-detail-view__section-empty">
          {{ t('projects.noTasksHere') }}
        </p>
      </template>

      <div class="project-detail-view__actions">
        <AppButton variant="primary" icon="plus" @click="showCreateTask = true">
          {{ t('projects.addTask') }}
        </AppButton>

        <RouterLink
          :to="`/projects/${route.params.id}/board`"
          class="project-detail-view__board-link"
        >
          {{ t('projects.switchToBoard') }}
        </RouterLink>

        <AppButton
          variant="ghost"
          icon="archive"
          :disabled="archiving"
          @click="showArchive = true"
        >
          {{ archiving ? t('projects.archiving') : t('projects.archive') }}
        </AppButton>
      </div>
    </template>

    <div v-else class="project-detail-view__status project-detail-view__status--mt">
      {{ t('projects.notFound') }}
      <RouterLink to="/projects" class="project-detail-view__back-link">
        {{ t('projects.notFoundBack') }}
      </RouterLink>
    </div>

    <CreateProjectTaskModal
      v-if="project"
      v-model="showCreateTask"
      :project-id="project.id"
    />

    <AppConfirmDialog
      v-model="showArchive"
      :title="t('projects.archive')"
      :message="t('projects.archiveConfirm')"
      :confirm-label="t('projects.archiveConfirmCta')"
      :busy-label="t('projects.archiving')"
      :cancel-label="t('common.cancel')"
      :busy="archiving"
      variant="primary"
      @confirm="handleArchive"
    />
  </div>
</template>

<script>
/** ProjectDetailView — project overview with progress stats, task sections, and board navigation. */
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProjectsStore } from '@/stores/projects.store.js'
import AppScreenHeading from '@/components/ui/AppScreenHeading.vue'
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppPill from '@/components/ui/AppPill.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import AppProgressBar from '@/components/ui/AppProgressBar.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import CreateProjectTaskModal from '@/components/projects/CreateProjectTaskModal.vue'

export default {
  name: 'ProjectDetailView',
  components: {
    RouterLink,
    AppScreenHeading,
    AppSectionHeader,
    AppButton,
    AppCard,
    AppPill,
    AppCheckbox,
    AppProgressBar,
    AppConfirmDialog,
    AppIcon,
    CreateProjectTaskModal
  },
  setup() {
    // -- State --
    const route = useRoute()
    const router = useRouter()
    const store = useProjectsStore()
    const { t } = useI18n()
    const showCreateTask = ref(false)
    const showArchive = ref(false)
    const archiving = ref(false)

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

    /**
     * Task sections derived from the project's custom columns (kanban
     * migration). Sections render in the user's configured column order;
     * empty columns are kept so the user can drag tasks into them from the
     * board even from this overview screen.
     */
    const sections = computed(() => {
      const board = store.board
      if (!board?.columns) return []
      return board.columns.map(col => {
        const entry = board.tasksByColumn?.find(t => t.columnId === col.id)
        return { key: col.id, label: col.label, tasks: entry?.tasks ?? [] }
      })
    })

    // -- Lifecycle --
    onMounted(() => store.loadBoard(route.params.id))

    return {
      route,
      store,
      project,
      done,
      open,
      percent,
      sections,
      t,
      showCreateTask,
      showArchive,
      archiving,
      handleArchive
    }

    // -- Function definitions --

    async function handleArchive() {
      if (archiving.value) return
      archiving.value = true

      try {
        await store.archiveProject(route.params.id)
        showArchive.value = false
        router.push('/projects')
      } catch {
        // Error already toasted by the store
      } finally {
        archiving.value = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.project-detail-view {
  &__back-link {
    @apply inline-flex items-center gap-1.5 font-mono text-[12px] text-muted hover:text-ink;
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
    // 1-up on phones, 3-up from sm+.
    @apply grid grid-cols-1 gap-4 sm:grid-cols-3;
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

    @media (prefers-reduced-motion: no-preference) {
      transition:
        background-color 150ms ease,
        color 150ms ease,
        transform 220ms cubic-bezier(0.4, 0, 0.2, 1);
    }
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

@media (prefers-reduced-motion: no-preference) {
  .task-complete-leave-active {
    transition:
      opacity 220ms ease-out,
      transform 220ms ease-out,
      max-height 220ms ease-out 80ms,
      margin 220ms ease-out 80ms,
      padding 220ms ease-out 80ms;
    overflow: hidden;
  }

  .task-complete-leave-from {
    // Generous ceiling above any realistic row/card height (kanban cards
    // with multiline titles can reach ~200px). If the natural height ever
    // exceeded the ceiling, the leave animation would snap before the
    // collapse begins.
    max-height: 400px;
  }

  .task-complete-leave-to {
    opacity: 0;
    transform: translateX(8px);
    max-height: 0;
    margin-top: 0;
    margin-bottom: 0;
    padding-top: 0;
    padding-bottom: 0;
  }

  .task-complete-enter-active {
    transition:
      opacity 180ms ease-out 120ms,
      transform 180ms ease-out 120ms;
  }

  .task-complete-enter-from {
    opacity: 0;
    transform: translateY(-4px);
  }

  .task-complete-move {
    transition: transform 220ms cubic-bezier(0.4, 0, 0.2, 1);
  }
}
</style>
