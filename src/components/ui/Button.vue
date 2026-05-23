<template>
  <button
    :type="type"
    :disabled="disabled"
    class="button"
    :class="[`button--${variant}`, `button--${size}`]"
  >
    <Icon v-if="icon" :name="icon" :size="16" />

    <slot />

    <Icon v-if="iconTrailing" :name="iconTrailing" :size="16" />
  </button>
</template>

<script>
/** Button — primary interactive element with variant and size modifiers. */
import Icon from './Icon.vue'

export default {
  name: 'Button',
  components: { Icon },
  props: {
    /** Visual variant */
    variant: {
      type: String,
      default: 'default',
      validator: v => ['default', 'primary', 'accent', 'ghost'].includes(v)
    },
    /** Button size */
    size: { type: String, default: 'md', validator: v => ['sm', 'md'].includes(v) },
    /** Leading icon name; empty for none */
    icon: { type: String, default: '' },
    /** Trailing icon name; empty for none */
    iconTrailing: { type: String, default: '' },
    /**
     * Native button type attribute. Validated so a typo cannot silently
     * default to `submit` and trigger accidental form submission (WEB-W2-29).
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
.button {
  @apply inline-flex items-center gap-2 rounded-pill font-medium whitespace-nowrap transition-colors;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;

  &--default {
    @apply bg-paper-2 text-ink border border-rule-soft hover:bg-paper-3 hover:border-muted;
  }

  &--primary {
    @apply bg-ink text-paper border border-ink hover:brightness-90;
  }

  &--accent {
    @apply bg-accent text-accent-ink border border-accent hover:brightness-95;
  }

  &--ghost {
    @apply bg-transparent text-ink border border-transparent hover:bg-paper-3;
  }

  &--sm {
    @apply text-[12px] px-3 py-1.5;
  }

  &--md {
    @apply text-[13px] px-4 py-2;
  }
}
</style>
