<template>
  <div>
    <ScreenHeading eyebrow="Workspaces · Projects" title="Six things you're" emphasis="becoming." />

    <div v-if="store.loading" class="text-[13px] text-muted">
      Loading…
    </div>

    <div v-else-if="store.error" class="text-[13px] text-bad">
      {{ store.error }}
    </div>

    <template v-else>
      <div class="mt-7 flex gap-2.5">
        <Button variant="primary">
          New project
        </Button>
      </div>

      <SectionHeader label="Active" :count="store.projects.length" />

      <div class="grid grid-cols-2 gap-4">
        <ProjectCard
          v-for="project in store.projects"
          :key="project.id"
          :project="project"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useProjectsStore } from '@/stores/projects.store'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Button from '@/components/ui/Button.vue'
import ProjectCard from '@/components/projects/ProjectCard.vue'

const store = useProjectsStore()
onMounted(() => store.loadProjects())
</script>
