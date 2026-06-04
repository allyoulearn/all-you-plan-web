<template>
  <div class="app-error-state" role="alert">
    <span class="app-error-state__message">
      {{ message }}
    </span>

    <AppButton size="sm" variant="ghost" @click="$emit('retry')">
      {{ retryLabel }}
    </AppButton>
  </div>
</template>

<script>
/**
 * AppErrorState — inline error message with a retry button. Used by data views
 * to surface a failed load and let the user re-issue it.
 *
 * No i18n inside (this is a `ui/` primitive): callers pass already-translated
 * strings. `message` is required; `retryLabel` defaults to "Retry" but callers
 * should pass `t('common.retry')` so the button tracks the active locale.
 *
 * Emits `retry` when the button is clicked — the caller wires this to the
 * view's load action.
 */
import AppButton from './AppButton.vue'

export default {
  name: 'AppErrorState',
  components: { AppButton },
  props: {
    /** Error text to display. Pass an already-translated, human-readable message. */
    message: { type: String, required: true },
    /** Retry button label. Defaults to English; pass t('common.retry') from callers. */
    retryLabel: { type: String, default: 'Retry' }
  },
  emits: ['retry']
}
</script>

<style lang="scss" scoped>
.app-error-state {
  // Mirrors the hand-rolled `…__status--error` markup the views used before
  // this primitive so adopting it leaves the visuals unchanged.
  @apply flex items-center gap-2 text-[13px] text-bad;

  &__message {
    @apply min-w-0;
  }
}
</style>
