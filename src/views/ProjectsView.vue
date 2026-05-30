<template>
  <div>
    <!-- Screen heading -->
    <AppScreenHeading
      :eyebrow="`${t('nav.workspaces')} · ${t('nav.itemProjects')}`"
      :title="t('projects.headingPrefix')"
      :emphasis="t('projects.headingEmphasis')"
    />

    <!-- Loading state -->
    <div v-if="store.loadingProjects" class="projects-view__status">
      {{ t('common.loading') }}
    </div>

    <!-- Error state -->
    <div
      v-else-if="store.errorProjects"
      class="projects-view__status projects-view__status--error"
    >
      <span>
        {{ store.errorProjects }}
      </span>

      <AppButton size="sm" variant="ghost" @click="reload">
        {{ t('common.retry') }}
      </AppButton>
    </div>

    <!-- Projects content -->
    <template v-else>
      <!-- Action bar -->
      <div class="projects-view__actions">
        <AppButton
          v-if="segment === 'active'"
          variant="primary"
          icon="plus"
          @click="showCreate = true"
        >
          {{ t('projects.newProject') }}
        </AppButton>

        <AppSegmentedControl
          v-model="segment"
          :group-label="t('projects.segmentLabel')"
          :options="segmentOptions"
        />
      </div>

      <!-- Section header -->
      <AppSectionHeader :label="activeLabel" :count="visibleProjects.length" />

      <!-- Empty state -->
      <div v-if="!visibleProjects.length" class="projects-view__empty">
        {{ emptyLabel }}
      </div>

      <!-- Project grid -->
      <div v-else class="projects-view__grid">
        <ProjectCard
          v-for="project in visibleProjects"
          :key="project.id"
          :project="project"
          :archived="segment === 'archived'"
          @restore="onRestore"
        />
      </div>
    </template>

    <!-- Create project modal -->
    <CreateProjectModal v-model="showCreate" @created="handleCreated" />
  </div>
</template>

<script>
/**
 * ProjectsView — lists projects in a two-column card grid. A segmented
 * control switches between Active and Archived; archived projects render
 * with a Restore action instead of the default detail link.
 */
import { computed, onMounted, ref, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProjectsStore } from '@/stores/projects.store.js'
import AppScreenHeading from '@/components/ui/AppScreenHeading.vue'
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue'
import AppSegmentedControl from '@/components/ui/AppSegmentedControl.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ProjectCard from '@/components/projects/ProjectCard.vue'
import CreateProjectModal from '@/components/projects/CreateProjectModal.vue'

export default {
  name: 'ProjectsView',
  components: {
    AppScreenHeading,
    AppSectionHeader,
    AppSegmentedControl,
    AppButton,
    ProjectCard,
    CreateProjectModal
  },
  setup() {
    const store = useProjectsStore()
    const router = useRouter()
    const { t } = useI18n()
    const showCreate = ref(false)
    const segment = ref('active')

    const segmentOptions = computed(() => [
      { value: 'active', label: t('projects.segmentActive') },
      { value: 'archived', label: t('projects.segmentArchived') }
    ])

    /** Projects from the store filtered to the active segment. The server
     *  query is parameterized by includeArchived so we only fetch what we
     *  need; the client filter is a defense-in-depth pass that keeps the
     *  view stable if a stale response includes the wrong shape. */
    const visibleProjects = computed(() => {
      const archivedView = segment.value === 'archived'
      return (store.projects ?? []).filter(p => !!p.archived === archivedView)
    })

    const activeLabel = computed(() =>
      segment.value === 'archived' ? t('projects.archivedSection') : t('projects.activeSection')
    )

    const emptyLabel = computed(() =>
      segment.value === 'archived'
        ? t('projects.archivedEmpty')
        : t('projects.activeEmpty')
    )

    // Re-fetch whenever the segment flips so we have fresh data for that view.
    watch(segment, () => reload())

    onMounted(() => reload())

    return {
      store,
      t,
      showCreate,
      segment,
      segmentOptions,
      visibleProjects,
      activeLabel,
      emptyLabel,
      reload,
      handleCreated,
      onRestore
    }

    // -- Function definitions --

    /** Refetch projects for the current segment (Active vs Archived). */
    function reload() {
      store.loadProjects({ includeArchived: segment.value === 'archived' })
    }

    /**
     * Navigate to a freshly created project's detail screen.
     * @param {{ id: string }|null|undefined} project
     */
    async function handleCreated(project) {
      if (!project?.id) return
      await nextTick()
      router.push(`/projects/${project.id}`)
    }

    /**
     * Restore an archived project and refresh the current segment so the
     * card moves out of the archived list.
     * @param {string} projectId
     */
    async function onRestore(projectId) {
      try {
        await store.restoreProject(projectId)
        // Refresh the current segment so the restored project disappears
        // from the archived list and re-appears in active on next view.
        reload()
      } catch {
        // Toast surfaced by the store.
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.projects-view {
  &__status {
    @apply flex items-center gap-2 text-[13px] text-muted;

    &--error {
      @apply text-bad;
    }
  }

  &__actions {
    @apply mt-7 flex items-center justify-between gap-2.5;
  }

  &__empty {
    @apply mt-3 text-[13px] text-muted;
  }

  &__grid {
    // Phones: single column so cards keep their breathing room. Two columns
    // from sm+ where there's space for both cards side by side.
    @apply grid grid-cols-1 gap-4 sm:grid-cols-2;
  }
}
</style>
