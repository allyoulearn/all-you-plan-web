<template>
  <div
    class="progress-bar"
    :class="thin ? 'progress-bar--thin' : 'progress-bar--normal'"
  >
    <div class="progress-bar__fill" :style="{ width: pct }" />
  </div>
</template>

<script>
/** ProgressBar — horizontal fill indicator clamped between 0 and 1. */
import { computed } from 'vue'

export default {
  name: 'ProgressBar',
  props: {
    /** Fill ratio between 0 and 1 */
    value: { type: Number, default: 0, validator: v => v >= 0 && v <= 1 },
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
