<template>
  <button
    :type="type"
    :disabled="disabled"
    class="icon-button"
    :class="`icon-button--${variant}`"
    :style="{ '--icon-button-size': `${size}px` }"
  >
    <!-- Single icon, sized as ~47% of the button -->
    <AppIcon :name="icon" :size="Math.round(size * 0.47)" />
  </button>
</template>

<script>
/** AppIconButton — square pill button that renders a single icon. */
import AppIcon from './AppIcon.vue'

export default {
  name: 'AppIconButton',
  components: { AppIcon },
  props: {
    /** AppIcon name */
    icon: { type: String, required: true },
    /** Pixel size of the button */
    size: { type: Number, default: 34 },
    /** Visual variant */
    variant: {
      type: String,
      default: 'default',
      validator: v => ['default', 'ghost'].includes(v)
    },
    /**
     * Native button type attribute. Validated to catch typos that would
     * otherwise silently default to `submit`.
     */
    type: {
      type: String,
      default: 'button',
      validator: v => ['button', 'submit', 'reset'].includes(v)
    },
    /** Whether the button is disabled */
    disabled: { type: Boolean, default: false }
  }
}
</script>

<style lang="scss" scoped>
.icon-button {
  // Width/height driven by a CSS custom property set inline by the consumer
  // via the `size` prop. Keeps layout declarations in the
  // stylesheet rather than inline binding.
  width: var(--icon-button-size, 34px);
  height: var(--icon-button-size, 34px);

  @apply grid place-items-center rounded-pill text-ink-2 transition-colors hover:text-ink disabled:opacity-50;
  @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;

  &--default {
    @apply bg-paper-2 border border-rule-soft hover:bg-paper-3;
  }

  &--ghost {
    @apply bg-transparent hover:bg-paper-3;
  }
}
</style>
