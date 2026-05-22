<template>
  <button
    type="button"
    :disabled="disabled"
    class="checkbox"
    :class="modelValue ? 'checkbox--checked' : 'checkbox--unchecked'"
    :style="{ width: `${size}px`, height: `${size}px` }"
    @click="toggle"
  >
    <Icon
      v-if="modelValue"
      name="check"
      :size="Math.round(size * 0.6)"
      class="checkbox__icon"
    />
  </button>
</template>

<script>
/** Checkbox — toggle button with checked/unchecked visual states and v-model support. */
import Icon from './Icon.vue'

export default {
  name: 'Checkbox',
  components: { Icon },
  props: {
    /** Checked state (v-model) */
    modelValue: { type: Boolean, default: false },
    /** Pixel size of the checkbox square */
    size: { type: Number, default: 20 },
    /** Whether the checkbox is disabled */
    disabled: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return { toggle }

    // -- Function definitions --

    /** Toggle the checked state; no-ops when disabled. */
    function toggle() {
      if (!props.disabled) emit('update:modelValue', !props.modelValue)
    }
  }
}
</script>

<style lang="scss" scoped>
.checkbox {
  @apply grid place-items-center rounded-pill border transition-colors disabled:opacity-50;

  &--checked {
    @apply border-accent bg-accent;
  }

  &--unchecked {
    @apply border-rule-soft bg-paper-2 hover:border-muted;
  }

  &__icon {
    @apply text-accent-ink;
  }
}
</style>
