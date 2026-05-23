<template>
  <span
    class="pill"
    :class="[`pill--${variant}`, variant === 'dot' ? `pill--dot-${dotTone}` : null]"
  >
    <span v-if="variant === 'dot'" class="pill__dot" />

    <slot />
  </span>
</template>

<script>
/** Pill — inline badge with variant modifiers including a dot indicator. */

export default {
  name: 'Pill',
  props: {
    /** Visual variant */
    variant: {
      type: String,
      default: 'default',
      validator: v => ['default', 'accent', 'soft', 'dot'].includes(v)
    },
    /**
     * Tone of the dot indicator when `variant="dot"`. Lets consumers signal
     * status (good/warn/bad) without overriding scoped styles (WEB-W2-36).
     * Ignored for non-dot variants.
     */
    dotTone: {
      type: String,
      default: 'accent',
      validator: v => ['accent', 'good', 'warn', 'bad', 'muted'].includes(v)
    }
  }
}
</script>

<style lang="scss" scoped>
.pill {
  @apply inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[11px] font-medium;

  &--default {
    @apply bg-paper-3 text-ink-2;
  }

  &--dot {
    @apply bg-paper-3 text-ink-2;
  }

  &--accent {
    @apply bg-accent text-accent-ink;
  }

  &--soft {
    @apply border border-rule-soft bg-transparent text-muted;
  }

  &__dot {
    @apply h-1.5 w-1.5 rounded-pill bg-accent;
  }

  // Dot tone modifiers (WEB-W2-36).
  &--dot-accent &__dot {
    @apply bg-accent;
  }

  &--dot-good &__dot {
    @apply bg-emerald-500;
  }

  &--dot-warn &__dot {
    @apply bg-amber-500;
  }

  &--dot-bad &__dot {
    @apply bg-rose-500;
  }

  &--dot-muted &__dot {
    @apply bg-muted;
  }
}
</style>
