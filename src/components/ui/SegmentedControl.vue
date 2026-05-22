<template>
  <div class="segmented-control">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="segmented-control__option"
      :class="opt.value === modelValue
        ? 'segmented-control__option--active'
        : 'segmented-control__option--inactive'"
      @click="$emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
      <span v-if="opt.count != null" class="segmented-control__count">
        {{ opt.count }}
      </span>
    </button>
  </div>
</template>

<script>
/** SegmentedControl — pill-shaped tab switcher with v-model binding. */

export default {
  name: 'SegmentedControl',
  props: {
    /** Currently selected value (v-model) */
    modelValue: { type: [String, Number], default: '' },
    /** Array of option objects with value, label, and optional count */
    options: { type: Array, default: () => [] }
  },
  emits: ['update:modelValue']
}
</script>

<style lang="scss" scoped>
.segmented-control {
  @apply inline-flex gap-0.5 rounded-md bg-paper-3 p-[3px];

  &__option {
    @apply inline-flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-[12.5px] font-medium transition-colors;

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
