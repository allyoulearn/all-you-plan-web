<template>
  <RouterLink :to="`/projects/${project.id}`" class="project-card-link">
    <Card>
      <div class="project-card__tags">
        <Pill variant="default">
          {{ project.tag }}
        </Pill>

        <Pill :variant="project.status === 'hot' ? 'accent' : 'default'">
          {{ statusLabel }}
        </Pill>
      </div>

      <h3 class="project-card__name">
        {{ project.name }}
      </h3>

      <p v-if="project.blurb" class="project-card__blurb">
        {{ project.blurb }}
      </p>

      <div v-if="progress">
        <ProgressBar :value="progress.percent / 100" />

        <div class="project-card__progress-meta">
          <span class="project-card__progress-fraction">
            {{ progress.done }}/{{ progress.total }}
          </span>

          <span class="project-card__progress-percent">
            {{ progress.percent }}%
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
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Card from '@/components/ui/Card.vue'
import Pill from '@/components/ui/Pill.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import Icon from '@/components/ui/Icon.vue'

/**
 * Map from API status enum to the matching i18n key (WEB-W3-18). Replaces the
 * previous module-level English-only map so the labels respond to locale
 * changes. Unknown values fall back to the raw enum.
 */
const STATUS_KEY = {
  on_track: 'projects.statusOnTrack',
  hot: 'projects.statusHot',
  stalled: 'projects.statusStalled',
  idle: 'projects.statusIdle'
}

export default {
  name: 'ProjectCard',
  components: { RouterLink, Card, Pill, ProgressBar, Icon },
  props: {
    /** The project object to display */
    project: { type: Object, required: true }
  },
  setup(props) {
    const { t } = useI18n()

    /** Safe progress object; null when the API returns no progress data. */
    const progress = computed(() => props.project.progress ?? null)

    /** Human-readable status label resolved from the API enum value via i18n. */
    const statusLabel = computed(() => {
      const key = STATUS_KEY[props.project.status]
      return key ? t(key) : props.project.status
    })

    return { progress, statusLabel }
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
