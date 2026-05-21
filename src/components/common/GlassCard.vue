<template>
  <component :is="tag" :class="['glass-card', $attrs.class]">
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
  },
  setup() {
    return {}
  },
}
</script>

<style lang="scss" scoped>
// ── Block ──
.glass-card {
  @apply border border-white/10 rounded-glass backdrop-blur-glass shadow-glass;
  background: rgba(255, 255, 255, 0.03);
}
</style>
