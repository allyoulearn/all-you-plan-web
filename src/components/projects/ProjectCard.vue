<template>
  <component
    :is="archived ? 'div' : 'router-link'"
    :to="archived ? undefined : `/projects/${project.id}`"
    class="project-card-link"
    :class="{ 'project-card-link--archived': archived }"
  >
    <AppCard class="project-card">
      <!-- Header: tags, title, blurb. Stays at the top of the card. -->
      <div class="project-card__head">
        <!-- Tag (what kind) + status (how it's going). Different visual
             treatments so the eye doesn't have to parse two identical pills. -->
        <div class="project-card__tags">
          <AppPill v-if="project.tag" variant="soft">
            {{ project.tag }}
          </AppPill>

          <AppPill variant="dot" :dot-tone="statusTone">
            {{ statusLabel }}
          </AppPill>

          <AppPill v-if="archived" variant="soft">
            {{ t('projects.archivedBadge') }}
          </AppPill>
        </div>

        <!-- Title -->
        <div class="project-card__name-row">
          <h3 class="project-card__name">
            {{ project.name }}
          </h3>

          <WrenOriginBadge ref-type="project" :ref-id="project.id" />
        </div>

        <!-- Blurb -->
        <p v-if="project.blurb" class="project-card__blurb">
          {{ project.blurb }}
        </p>
      </div>

      <!-- Footer: progress + nudge. Pinned to the bottom (mt-auto) so cards
           of different content lengths align on a shared baseline. -->
      <div class="project-card__foot">
        <!-- Progress -->
        <div v-if="progress" class="project-card__progress">
          <div class="project-card__progress-head">
            <span class="project-card__progress-fraction">
              {{ progress.done }} / {{ progress.total }}
            </span>

            <span
              class="project-card__progress-percent"
              :class="{ 'project-card__progress-percent--complete': progress.percent === 100 }"
            >
              <AppIcon v-if="progress.percent === 100" name="check" :size="12" />
              {{ progress.percent }}%
            </span>
          </div>

          <AppProgressBar
            :value="progress.percent / 100"
            :class="{ 'project-card__progress-bar--complete': progress.percent === 100 }"
          />
        </div>

        <!-- Nudge -->
        <div v-if="project.nudge" class="project-card__nudge">
          <AppIcon name="flag" :size="14" />

          <span class="project-card__nudge-text">
            {{ project.nudge }}
          </span>
        </div>

        <!-- Archived actions -->
        <div v-if="archived" class="project-card__archived-actions">
          <AppButton size="sm" variant="ghost" @click="$emit('restore', project.id)">
            {{ t('projects.restore') }}
          </AppButton>
        </div>
      </div>
    </AppCard>
  </component>
</template>

<script>
/** ProjectCard — project summary card linking to the project detail view. */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppCard from '@/components/ui/AppCard.vue'
import AppPill from '@/components/ui/AppPill.vue'
import AppProgressBar from '@/components/ui/AppProgressBar.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import WrenOriginBadge from '@/components/wren/WrenOriginBadge.vue'

/**
 * Map from API status enum to the matching i18n key. Replaces the
 * previous module-level English-only map so the labels respond to locale
 * changes. Unknown values fall back to the raw enum.
 */
const STATUS_KEY = {
  on_track: 'projects.statusOnTrack',
  hot: 'projects.statusHot',
  stalled: 'projects.statusStalled',
  idle: 'projects.statusIdle'
}

/** Status enum → dot tone. Drives the semantic color signal in the status pill. */
const STATUS_TONE = {
  on_track: 'good',
  hot: 'warn',
  stalled: 'bad',
  idle: 'muted'
}

export default {
  name: 'ProjectCard',
  components: { RouterLink, AppCard, AppPill, AppProgressBar, AppIcon, AppButton, WrenOriginBadge },
  props: {
    /** The project object to display */
    project: { type: Object, required: true },
    /** When true, render the card in read-only archived mode with a Restore action. */
    archived: { type: Boolean, default: false }
  },
  emits: ['restore'],
  setup(props) {
    // -- State --
    const { t } = useI18n()

    // -- Computed --
    /** Safe progress object; null when the API returns no progress data. */
    const progress = computed(() => props.project.progress ?? null)

    /** Human-readable status label resolved from the API enum value via i18n. */
    const statusLabel = computed(() => {
      const key = STATUS_KEY[props.project.status]
      return key ? t(key) : props.project.status
    })

    /** Tone passed to the status pill's dot indicator. Falls back to muted. */
    const statusTone = computed(() => STATUS_TONE[props.project.status] ?? 'muted')

    return { progress, statusLabel, statusTone, t }
  }
}
</script>

<style lang="scss" scoped>
.project-card-link {
  @apply block h-full no-underline;

  &--archived {
    @apply opacity-80;
  }
}

// `:deep(.card)` reaches into the AppCard root so the card surface itself
// stretches to fill the grid row and animates its shadow on hover.
.project-card-link :deep(.card) {
  @apply h-full transition-shadow duration-150;
}

.project-card-link:not(.project-card-link--archived):hover :deep(.card) {
  @apply shadow-md;
}

.project-card {
  &__head {
    @apply flex flex-col gap-2.5;
  }

  // Pinned to the bottom so progress bars line up across cards of varying
  // content length. Without this, a card with a nudge sits taller than
  // a card without one.
  &__foot {
    @apply mt-auto flex flex-col gap-2.5;
  }

  &__tags {
    @apply flex flex-wrap items-center gap-1.5;
  }

  &__name-row {
    @apply flex items-center gap-2;
  }

  &__name {
    @apply font-serif text-[22px] font-normal leading-tight tracking-[-0.01em] text-ink;
  }

  &__blurb {
    @apply text-[13px] leading-relaxed text-muted;
  }

  &__progress {
    @apply flex flex-col gap-1.5;
  }

  &__progress-head {
    @apply flex items-baseline justify-between;
  }

  &__progress-fraction {
    @apply font-mono text-[11px] text-muted;
  }

  &__progress-percent {
    @apply inline-flex items-center gap-1 font-mono text-[12px] font-medium text-ink-2 tabular-nums;

    &--complete {
      @apply text-ok;
    }
  }

  // Recolor the underlying AppProgressBar fill when the project is done. Uses
  // :deep so the override reaches into the scoped child component.
  &__progress-bar--complete :deep(.progress-bar__fill) {
    @apply bg-ok;
  }

  &__nudge {
    @apply flex items-center gap-1.5 text-accent;
  }

  &__nudge-text {
    @apply text-[12px] font-medium;
  }

  &__archived-actions {
    @apply flex justify-end;
  }
}
</style>
