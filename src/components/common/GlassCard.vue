<template>
  <component :is="tag" :class="['glass-card', $attrs.class]">
    <!-- Optional gradient accent bar -->
    <div
      v-if="accent"
      class="glass-card__accent surface-accent"
      :style="{ '--accent-color': accent }"
    />
    <!-- Default slot for card content -->
    <slot />
  </component>
</template>

<script>
export default {
  name: 'GlassCard',
  inheritAttrs: false,
  props: {
    /** HTML tag to render as the root element */
    tag: { type: String, default: 'div' },
    /** Optional accent colour; when set, renders a gradient bar at the top edge */
    accent: { type: String, default: '' },
  },
  setup() {
    return {}
  },
}
</script>

<style lang="scss" scoped>
// ── Block ──
.glass-card {
  @apply border border-white/10 rounded-glass backdrop-blur-glass shadow-glass overflow-hidden;
  background: rgba(255, 255, 255, 0.03);

  &__accent {
    @apply w-full;
  }
}
</style>
