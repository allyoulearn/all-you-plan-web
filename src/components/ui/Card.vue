<template>
  <component
    :is="as"
    class="card"
    :class="`card--${variant}`"
  >
    <slot />
  </component>
</template>

<script>
/** Card — surface container with default and accent visual variants. */

export default {
  name: 'Card',
  props: {
    /** Visual variant */
    variant: {
      type: String,
      default: 'default',
      validator: v => ['default', 'accent'].includes(v)
    },
    /**
     * HTML element to render as. Validated against a curated semantic list
     * so a typo can't produce a non-semantic custom-element tag (WEB-W2-34).
     */
    as: {
      type: String,
      default: 'div',
      validator: v => ['div', 'section', 'article', 'aside', 'li'].includes(v)
    }
  }
}
</script>

<style lang="scss" scoped>
.card {
  @apply flex flex-col gap-2.5 rounded-md p-[22px];

  &--default {
    @apply bg-paper-2 text-ink shadow-sm;
  }

  &--accent {
    @apply bg-accent text-accent-ink shadow-accent-glow;
  }
}
</style>
