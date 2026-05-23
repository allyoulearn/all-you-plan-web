<template>
  <div
    class="segmented-control"
    role="group"
    :aria-label="groupLabel"
  >
    <button
      v-for="(opt, idx) in options"
      :key="opt.value"
      type="button"
      class="segmented-control__option"
      :class="opt.value === modelValue
        ? 'segmented-control__option--active'
        : 'segmented-control__option--inactive'"
      :aria-pressed="opt.value === modelValue"
      @click="$emit('update:modelValue', opt.value)"
      @keydown.left.prevent="moveTo(idx - 1)"
      @keydown.right.prevent="moveTo(idx + 1)"
      @keydown.home.prevent="moveTo(0)"
      @keydown.end.prevent="moveTo(options.length - 1)"
    >
      {{ opt.label }}
      <span v-if="opt.count != null" class="segmented-control__count">
        {{ opt.count }}
      </span>
    </button>
  </div>
</template>

<script>
/**
 * SegmentedControl — pill-shaped tab switcher with v-model binding.
 *
 * Keyboard: Tab focuses the first option; Left/Right arrow keys cycle the
 * selection (wrapping at the ends), Home/End jump to first/last. Activating
 * an option emits `update:modelValue` so consumers see the change as a
 * normal v-model update (WEB-W2-32).
 */

export default {
  name: 'SegmentedControl',
  props: {
    /** Currently selected value (v-model) */
    modelValue: { type: [String, Number], default: '' },
    /** Array of option objects with value, label, and optional count */
    options: { type: Array, default: () => [] },
    /** Accessible label for the control group */
    groupLabel: { type: String, default: 'View options' }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    function moveTo(idx) {
      if (!props.options.length) return
      const len = props.options.length
      // Wrap around at both ends so users do not get stuck at an edge.
      const wrapped = ((idx % len) + len) % len
      const opt = props.options[wrapped]
      if (opt) emit('update:modelValue', opt.value)
    }
    return { moveTo }
  }
}
</script>

<style lang="scss" scoped>
.segmented-control {
  @apply inline-flex gap-0.5 rounded-md bg-paper-3 p-[3px];

  &__option {
    @apply inline-flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-[12.5px] font-medium transition-colors;
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;

    &--active {
      @apply bg-paper-2 text-ink shadow-sm;
    }

    &--inactive {
      @apply text-muted hover:text-ink;
    }
  }

  &__count {
    @apply font-mono text-[11px] text-muted;
  }
}
</style>
