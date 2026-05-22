<template>
  <RouterLink :to="`/projects/${project.id}`" class="project-card-link">
    <Card>
      <div class="project-card__tags">
        <Pill variant="default">
          {{ project.tag }}
        </Pill>

        <Pill :variant="project.status === 'hot' ? 'accent' : 'default'">
          {{ project.status }}
        </Pill>
      </div>

      <h3 class="project-card__name">
        {{ project.name }}
      </h3>

      <p v-if="project.blurb" class="project-card__blurb">
        {{ project.blurb }}
      </p>

      <div>
        <ProgressBar :value="project.progress.percent / 100" />

        <div class="project-card__progress-meta">
          <span class="project-card__progress-fraction">
            {{ project.progress.done }}/{{ project.progress.total }}
          </span>

          <span class="project-card__progress-percent">
            {{ project.progress.percent }}%
          </span>
        </div>
      </div>

      <div v-if="project.nudge" class="project-card__nudge">
        <Icon name="flag" :size="14" />

        <span class="project-card__nudge-text">
          {{ project.nudge }}
        </span>
      </div>
    </Card>
  </RouterLink>
</template>

<script>
/** ProjectCard — project summary card linking to the project detail view. */
import { RouterLink } from 'vue-router'
import Card from '@/components/ui/Card.vue'
import Pill from '@/components/ui/Pill.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import Icon from '@/components/ui/Icon.vue'

export default {
  name: 'ProjectCard',
  components: { RouterLink, Card, Pill, ProgressBar, Icon },
  props: {
    /** The project object to display */
    project: { type: Object, required: true }
  }
}
</script>

<style lang="scss" scoped>
.project-card-link {
  @apply block no-underline;
}

.project-card {
  &__tags {
    @apply flex items-center gap-2;
  }

  &__name {
    @apply font-serif text-[22px] font-normal leading-tight tracking-[-0.01em] text-ink;
  }

  &__blurb {
    @apply text-[13px] leading-relaxed text-muted;
  }

  &__progress-meta {
    @apply mt-1.5 flex items-center gap-2;
  }

  &__progress-fraction {
    @apply font-mono text-[11px] text-muted;
  }

  &__progress-percent {
    @apply font-mono text-[11px] text-muted;
  }

  &__nudge {
    @apply flex items-center gap-1.5 text-accent;
  }

  &__nudge-text {
    @apply text-[12px] font-medium;
  }
}
</style>
