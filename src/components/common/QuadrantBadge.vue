<template>
  <span
    :class="['quadrant-badge', `quadrant-badge--${quadrant}`]"
    :style="{ background: config.color }"
  >
    {{ config.label }}
  </span>
</template>

<script>
import { computed } from 'vue'
import { QUADRANT_CONFIG } from '@/utils/quadrantColors'

export default {
  name: 'QuadrantBadge',
  props: {
    /** Quadrant key: 'do' | 'schedule' | 'delegate' | 'drop' */
    quadrant: {
      type: String,
      required: true,
      validator: (val) => ['do', 'schedule', 'delegate', 'drop'].includes(val),
    },
  },
  setup(props) {
    // ── Computed ──

    /** Config entry for the given quadrant */
    const config = computed(() => QUADRANT_CONFIG[props.quadrant])

    return {
      config,
    }
  },
}
</script>

<style lang="scss" scoped>
// ── Block ──
.quadrant-badge {
  @apply inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full text-white;
  @apply whitespace-nowrap;

  // ── Modifiers: delegate has dark text for legibility on yellow ──
  &--delegate {
    @apply text-secondary-900;
  }
}
</style>
