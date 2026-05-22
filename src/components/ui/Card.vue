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
    /** HTML element or component to render as */
    as: { type: String, default: 'div' }
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
