<template>
  <div
    class="progress-bar"
    :class="thin ? 'progress-bar--thin' : 'progress-bar--normal'"
  >
    <!-- Fill (width = clamped value) -->
    <div class="progress-bar__fill" :style="{ width: pct }" />
  </div>
</template>

<script>
/** AppProgressBar — horizontal fill indicator clamped between 0 and 1. */
import { computed } from 'vue'

export default {
  name: 'AppProgressBar',
  props: {
    /** Fill ratio between 0 and 1; out-of-range values are clamped, not rejected. */
    value: { type: Number, default: 0 },
    /** Render a thinner track when true */
    thin: { type: Boolean, default: false }
  },
  setup(props) {
    // -- Computed --

    /** CSS width string derived from value, clamped to [0, 1]. */
    const pct = computed(() => `${Math.max(0, Math.min(1, props.value)) * 100}%`)

    return { pct }
  }
}
</script>

<style lang="scss" scoped>
.progress-bar {
  @apply overflow-hidden rounded-pill;

  &--normal {
    @apply h-1.5 bg-paper-3;
  }

  &--thin {
    @apply h-1 bg-rule-soft;
  }

  &__fill {
    @apply h-full rounded-pill bg-accent;
  }
}
</style>
