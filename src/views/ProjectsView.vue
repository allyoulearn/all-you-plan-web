<template>
  <div>
    <ScreenHeading eyebrow="Workspaces · Projects" title="Six things you're" emphasis="becoming." />

    <div v-if="store.loadingProjects" class="projects-view__status">
      Loading…
    </div>

    <div v-else-if="store.errorProjects" class="projects-view__status projects-view__status--error">
      {{ store.errorProjects }}
    </div>

    <template v-else>
      <div class="projects-view__actions">
        <Button variant="primary">
          New project
        </Button>
      </div>

      <SectionHeader label="Active" :count="store.projects.length" />

      <div class="projects-view__grid">
        <ProjectCard
          v-for="project in store.projects"
          :key="project.id"
          :project="project"
        />
      </div>
    </template>
  </div>
</template>

<script>
/** ProjectsView — lists active projects in a two-column card grid with a new-project action. */
import { onMounted } from 'vue'
import { useProjectsStore } from '@/stores/projects.store.js'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Button from '@/components/ui/Button.vue'
import ProjectCard from '@/components/projects/ProjectCard.vue'

export default {
  name: 'ProjectsView',
  components: { ScreenHeading, SectionHeader, Button, ProjectCard },
  setup() {
    // -- State --
    const store = useProjectsStore()

    // -- Lifecycle --
    onMounted(() => store.loadProjects())

    return { store }
  }
}
</script>

<style lang="scss" scoped>
.projects-view {
  &__status {
    @apply text-[13px] text-muted;

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
