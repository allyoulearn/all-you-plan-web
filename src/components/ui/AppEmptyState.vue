<template>
  <div class="app-empty-state">
    <AppIcon
      v-if="icon"
      :name="icon"
      :size="32"
      class="app-empty-state__icon"
    />

    <h2 class="app-empty-state__title">
      {{ title }}
    </h2>

    <p v-if="message" class="app-empty-state__message">
      {{ message }}
    </p>

    <div v-if="$slots.actions" class="app-empty-state__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script>
/**
 * AppEmptyState — centered "nothing here yet" panel with an optional icon,
 * a title, an optional supporting message, and an `#actions` slot for a CTA.
 *
 * No i18n inside (this is a `ui/` primitive): callers pass already-translated
 * strings. Generalizes the per-domain empty states (e.g. ChoresEmpty) so views
 * stop hand-rolling their own.
 */
import AppIcon from './AppIcon.vue'

export default {
  name: 'AppEmptyState',
  components: { AppIcon },
  props: {
    /** Optional Heroicons key (see iconMap.js). Omit for a text-only empty state. */
    icon: { type: String, default: '' },
    /** Heading line. Pass an already-translated string. */
    title: { type: String, required: true },
    /** Optional supporting line below the title. Already-translated. */
    message: { type: String, default: '' }
  }
}
</script>

<style lang="scss" scoped>
.app-empty-state {
  @apply mx-auto mt-12 flex max-w-sm flex-col items-center gap-3 text-center;

  &__icon {
    @apply text-muted;
  }

  &__title {
    @apply font-serif text-[24px] tracking-[-0.01em] text-ink;
  }

  &__message {
    @apply text-[13px] text-muted;
  }

  &__actions {
    @apply mt-1 flex flex-wrap items-center justify-center gap-2;
  }
}
</style>
