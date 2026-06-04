<template>
  <div
    class="app-skeleton"
    :class="`app-skeleton--${variant}`"
    role="status"
    :aria-label="ariaLabel"
  >
    <!-- Visible-to-AT (and to tests) label mirroring the aria-label, hidden
         visually so the shimmer carries the loading signal on screen. -->
    <span class="sr-only">
      {{ ariaLabel }}
    </span>

    <div v-for="n in rows" :key="n" class="app-skeleton__row">
      <div class="app-skeleton__check" />

      <div class="app-skeleton__body">
        <div class="app-skeleton__title" />

        <div class="app-skeleton__meta" />
      </div>

      <div class="app-skeleton__pill" />
    </div>
  </div>
</template>

<script>
/**
 * AppSkeleton — generic shimmer placeholder shown while a content shape loads.
 * Generalizes ChoresSkeleton so any list/card view can present a consistent
 * loading affordance instead of plain "Loading…" text.
 *
 * Variants:
 *   - `list` (default): N stacked rows with a leading check, two text lines,
 *     and a trailing pill — matches the row-list views (chores, inbox, kanban).
 *   - `card`: the same rows wrapped on a raised card surface for detail panes.
 *
 * The pulse animation is disabled under `prefers-reduced-motion`. No i18n
 * inside (a `ui/` primitive): `ariaLabel` defaults to English; callers may pass
 * t('common.loading').
 */
export default {
  name: 'AppSkeleton',
  props: {
    /** Number of placeholder rows to render. */
    rows: { type: Number, default: 4 },
    /** Surface treatment for the block. */
    variant: { type: String, default: 'list', validator: v => ['list', 'card'].includes(v) },
    /** Accessible label for the loading region. Already-translated; defaults to English. */
    ariaLabel: { type: String, default: 'Loading…' }
  }
}
</script>

<style lang="scss" scoped>
.app-skeleton {
  @apply rounded-md px-2.5 py-1;

  &--list,
  &--card {
    @apply bg-paper-2 shadow-sm;
  }

  &__row {
    @apply flex items-center gap-3.5 px-2 py-3;
  }

  &__check {
    @apply h-4 w-4 rounded-sm bg-rule-soft;
  }

  &__body {
    @apply flex flex-1 flex-col gap-1.5;
  }

  &__title {
    @apply h-3 w-1/2 rounded-sm bg-rule-soft;
  }

  &__meta {
    @apply h-2 w-1/3 rounded-sm bg-rule-soft opacity-70;
  }

  &__pill {
    @apply h-4 w-16 rounded-pill bg-rule-soft;
  }

  // Shimmer only when the user hasn't asked for reduced motion (family a11y
  // rule). The placeholder blocks still render as static bars otherwise.
  @media (prefers-reduced-motion: no-preference) {
    .app-skeleton__check,
    .app-skeleton__title,
    .app-skeleton__meta,
    .app-skeleton__pill {
      @apply animate-pulse;
    }
  }
}
</style>
