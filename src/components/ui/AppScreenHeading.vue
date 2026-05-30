<template>
  <header class="screen-heading">
    <!-- Title block -->
    <div class="screen-heading__main">
      <!-- Title with optional italic emphasis. The breadcrumb in the top
           bar already shows the section name, so there's no eyebrow here. -->
      <h1 class="screen-heading__title">
        {{ trimmedTitle }}<em v-if="emphasis" class="screen-heading__emphasis">
          {{ emphasis }}
        </em>
      </h1>
    </div>

    <!-- Meta slot -->
    <div v-if="$slots.meta" class="screen-heading__meta">
      <slot name="meta" />
    </div>
  </header>
</template>

<script>
/**
 * AppScreenHeading — top-of-screen heading with optional eyebrow, emphasis, and
 * meta slot.
 *
 * The template strips trailing whitespace from `title` and inserts exactly
 * one space before the italic emphasis. Without that the two halves
 * concatenate to a run-on word ("A quietfull day."). Callers used to
 * defensively add a trailing space (`title="Notes to "`); they no longer
 * need to, and double-spacing is prevented either way.
 */
import { computed } from 'vue'

export default {
  name: 'AppScreenHeading',
  props: {
    /**
     * Kept for backward compatibility with view callsites that still pass it;
     * intentionally not rendered because the top bar's breadcrumb already
     * shows the section context.
     */
    eyebrow: { type: String, default: '' },
    /**
     * Main heading text. Required and non-empty so a missing title can't
     * render an empty top-of-screen `<h1>` and leave the landmark unlabeled
     *.
     */
    title: {
      type: String,
      required: true,
      validator: v => typeof v === 'string' && v.trim().length > 0
    },
    /** Italic emphasis appended to the title */
    emphasis: { type: String, default: '' }
  },
  setup(props) {
    /** Title with trailing whitespace stripped so the CSS-injected space before `<em>` doesn't double up. */
    const trimmedTitle = computed(() => props.title.replace(/\s+$/, ''))
    return { trimmedTitle }
  }
}
</script>

<style lang="scss" scoped>
.screen-heading {
  // Mobile: stack so the meta slot doesn't push the title into a single
  // narrow column. Restore the side-by-side layout from sm+ where there's
  // enough horizontal space for both.
  @apply mb-7 flex flex-col items-start gap-2 pb-6;

  @media (min-width: 640px) {
    @apply flex-row items-end gap-[18px];
  }

  &__main {
    @apply min-w-0 flex-1;
  }

  &__title {
    // Step the title size up with the viewport — the 56px desktop size would
    // overflow most phone widths even with hyphens enabled.
    @apply font-serif text-[28px] font-normal leading-[1] tracking-[-0.02em] text-ink;

    @media (min-width: 640px) {
      @apply text-[36px] leading-[0.95];
    }

    @media (min-width: 1024px) {
      @apply text-[44px];
    }

    @media (min-width: 1280px) {
      @apply text-[56px];
    }
  }

  &__emphasis {
    @apply italic;

    // Inject a real space before the italic half. Vue's default whitespace
    // "condense" strips the space we'd otherwise put between `{{ title }}`
    // and the `<em>`, so we restore it here. `white-space: pre` keeps the
    // generated character from being collapsed by surrounding rules.
    &::before {
      content: ' ';
      white-space: pre;
    }
  }

  &__meta {
    @apply text-[13px] leading-relaxed text-muted;

    @media (min-width: 640px) {
      @apply text-right;
    }
  }
}
</style>
