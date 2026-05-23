<template>
  <button
    :type="type"
    :disabled="disabled"
    class="icon-button"
    :class="`icon-button--${variant}`"
    :style="{ '--icon-button-size': `${size}px` }"
  >
    <Icon :name="icon" :size="Math.round(size * 0.47)" />
  </button>
</template>

<script>
/** IconButton — square pill button that renders a single icon. */
import Icon from './Icon.vue'

export default {
  name: 'IconButton',
  components: { Icon },
  props: {
    /** Icon name */
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
     * otherwise silently default to `submit` (WEB-W2-29).
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
  // via the `size` prop (WEB-W2-41). Keeps layout declarations in the
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
