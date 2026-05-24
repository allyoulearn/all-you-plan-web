<template>
  <div>
    <ScreenHeading
      eyebrow="Workspaces · Projects"
      title="Six things you're"
      emphasis="becoming."
    />

    <div v-if="store.loadingProjects" class="projects-view__status">
      {{ t('common.loading') }}
    </div>

    <div
      v-else-if="store.errorProjects"
      class="projects-view__status projects-view__status--error"
    >
      <span>
        {{ store.errorProjects }}
      </span>

      <Button size="sm" variant="ghost" @click="reload">
        {{ t('common.retry') }}
      </Button>
    </div>

    <template v-else>
      <div class="projects-view__actions">
        <Button
          v-if="segment === 'active'"
          variant="primary"
          icon="plus"
          @click="showCreate = true"
        >
          {{ t('projects.newProject') }}
        </Button>

        <SegmentedControl
          v-model="segment"
          :group-label="t('projects.segmentLabel')"
          :options="segmentOptions"
        />
      </div>

      <SectionHeader :label="activeLabel" :count="visibleProjects.length" />

      <div v-if="!visibleProjects.length" class="projects-view__empty">
        {{ emptyLabel }}
      </div>

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
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import Button from '@/components/ui/Button.vue'
import ProjectCard from '@/components/projects/ProjectCard.vue'
import CreateProjectModal from '@/components/projects/CreateProjectModal.vue'

export default {
  name: 'ProjectsView',
  components: {
    ScreenHeading,
    SectionHeader,
    SegmentedControl,
    Button,
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

    function reload() {
      store.loadProjects({ includeArchived: segment.value === 'archived' })
    }

    // Re-fetch whenever the segment flips so we have fresh data for that view.
    watch(segment, () => reload())

    onMounted(() => reload())

    async function handleCreated(project) {
      if (!project?.id) return
      await nextTick()
      router.push(`/projects/${project.id}`)
    }

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
    @apply grid grid-cols-2 gap-4;
  }
}
</style>
