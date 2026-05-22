<template>
  <button
    :type="type"
    :disabled="disabled"
    class="icon-button"
    :class="`icon-button--${variant}`"
    :style="{ width: `${size}px`, height: `${size}px` }"
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
    /** Native button type attribute */
    type: { type: String, default: 'button' },
    /** Whether the button is disabled */
    disabled: { type: Boolean, default: false }
  }
}
</script>

<style lang="scss" scoped>
.icon-button {
  @apply grid place-items-center rounded-pill text-ink-2 transition-colors hover:text-ink disabled:opacity-50;

  &--default {
    @apply bg-paper-2 border border-rule-soft hover:bg-paper-3;
  }

  &--ghost {
    @apply bg-transparent hover:bg-paper-3;
  }
}
</style>
