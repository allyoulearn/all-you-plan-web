<template>
  <RouterLink :to="`/projects/${project.id}`" class="block no-underline">
    <Card>
      <div class="flex items-center gap-2">
        <Pill variant="default">
          {{ project.tag }}
        </Pill>

        <Pill :variant="project.status === 'hot' ? 'accent' : 'default'">
          {{ project.status }}
        </Pill>
      </div>

      <h3 class="font-serif text-[22px] font-normal leading-tight tracking-[-0.01em] text-ink">
        {{ project.name }}
      </h3>

      <p v-if="project.blurb" class="text-[13px] leading-relaxed text-muted">
        {{ project.blurb }}
      </p>

      <div>
        <ProgressBar :value="project.progress.percent / 100" />

        <div class="mt-1.5 flex items-center gap-2">
          <span class="font-mono text-[11px] text-muted">
            {{ project.progress.done }}/{{ project.progress.total }}
          </span>

          <span class="font-mono text-[11px] text-muted">
            {{ project.progress.percent }}%
          </span>
        </div>
      </div>

      <div v-if="project.nudge" class="flex items-center gap-1.5 text-accent">
        <Icon name="flag" :size="14" />

        <span class="text-[12px] font-medium">
          {{ project.nudge }}
        </span>
      </div>
    </Card>
  </RouterLink>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import Card from '@/components/ui/Card.vue'
import Pill from '@/components/ui/Pill.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import Icon from '@/components/ui/Icon.vue'

defineProps({
  project: { type: Object, required: true },
})
</script>
