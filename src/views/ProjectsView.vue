<template>
  <div>
    <ScreenHeading eyebrow="Workspaces · Projects" title="Six things you're" emphasis="becoming." />

    <div v-if="store.loadingProjects" class="projects-view__status">
      {{ t('common.loading') }}
    </div>

    <div v-else-if="store.errorProjects" class="projects-view__status projects-view__status--error">
      <span>
        {{ store.errorProjects }}
      </span>

      <Button size="sm" variant="ghost" @click="store.loadProjects()">
        {{ t('common.retry') }}
      </Button>
    </div>

    <template v-else>
      <div class="projects-view__actions">
        <Button variant="primary" icon="plus" @click="showCreate = true">
          {{ t('projects.newProject') }}
        </Button>
      </div>

      <SectionHeader :label="t('projects.activeSection')" :count="store.projects.length" />

      <div class="projects-view__grid">
        <ProjectCard
          v-for="project in store.projects"
          :key="project.id"
          :project="project"
        />
      </div>
    </template>

    <CreateProjectModal v-model="showCreate" @created="handleCreated" />
  </div>
</template>

<script>
/** ProjectsView — lists active projects in a two-column card grid with a new-project action. */
import { onMounted, ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProjectsStore } from '@/stores/projects.store.js'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Button from '@/components/ui/Button.vue'
import ProjectCard from '@/components/projects/ProjectCard.vue'
import CreateProjectModal from '@/components/projects/CreateProjectModal.vue'

export default {
  name: 'ProjectsView',
  components: { ScreenHeading, SectionHeader, Button, ProjectCard, CreateProjectModal },
  setup() {
    // -- State --
    const store = useProjectsStore()
    const router = useRouter()
    const { t } = useI18n()
    const showCreate = ref(false)

    // -- Lifecycle --
    onMounted(() => store.loadProjects())

    /**
     * Handle the create-modal's `created` event.
     *
     * Awaits one tick before navigating so the modal's close transition and
     * focus-restoration teardown finish before the view unmounts (WEB-W4-26).
     */
    async function handleCreated(project) {
      if (!project?.id) return
      await nextTick()
      router.push(`/projects/${project.id}`)
    }

    return { store, t, showCreate, handleCreated }
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
    @apply mt-7 flex gap-2.5;
  }

  &__grid {
    @apply grid grid-cols-2 gap-4;
  }
}
</style>
