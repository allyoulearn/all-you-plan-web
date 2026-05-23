<template>
  <header class="screen-heading">
    <div class="screen-heading__main">
      <p v-if="eyebrow" class="screen-heading__eyebrow">
        {{ eyebrow }}
      </p>

      <h1 class="screen-heading__title">
        {{ title }}<em v-if="emphasis" class="screen-heading__emphasis">
          {{ emphasis }}
        </em>
      </h1>
    </div>

    <div v-if="$slots.meta" class="screen-heading__meta">
      <slot name="meta" />
    </div>
  </header>
</template>

<script>
/** ScreenHeading — top-of-screen heading with optional eyebrow, emphasis, and meta slot. */

export default {
  name: 'ScreenHeading',
  props: {
    /** Small label above the main title */
    eyebrow: { type: String, default: '' },
    /**
     * Main heading text. Required and non-empty so a missing title can't
     * render an empty top-of-screen `<h1>` and leave the landmark unlabeled
     * (WEB-W2-35).
     */
    title: {
      type: String,
      required: true,
      validator: v => typeof v === 'string' && v.trim().length > 0
    },
    /** Italic emphasis appended to the title */
    emphasis: { type: String, default: '' }
  }
}
</script>

<style lang="scss" scoped>
.screen-heading {
  @apply mb-7 flex items-end gap-[18px] pb-6;

  &__main {
    @apply flex-1;
  }

  &__eyebrow {
    @apply mb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted;
  }

  &__title {
    @apply font-serif text-[44px] font-normal leading-[0.95] tracking-[-0.02em] text-ink xl:text-[56px];
  }

  &__emphasis {
    @apply italic;
  }

  &__meta {
    @apply text-right text-[13px] leading-relaxed text-muted;
  }
}
</style>
