<template>
  <button
    type="button"
    role="checkbox"
    :aria-checked="modelValue"
    :aria-label="ariaLabel"
    :disabled="disabled"
    class="checkbox"
    :class="modelValue ? 'checkbox--checked' : 'checkbox--unchecked'"
    :style="{ '--checkbox-size': `${size}px` }"
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
/**
 * Checkbox — toggle button with checked/unchecked visual states and v-model
 * support.
 *
 * Implemented as a native `<button role="checkbox">` so keyboard activation
 * (Space and Enter — both trigger `click` on a button) works without an
 * explicit keydown handler. WAI-ARIA specifies Space as the canonical
 * activation key for `role="checkbox"`; Enter also toggles here, which is
 * mildly off-spec but generally accepted. Any future refactor to a
 * non-button element MUST add explicit keydown handlers for Space (and
 * preferably Enter) to preserve this behavior (WEB-W2-33).
 */
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
    disabled: { type: Boolean, default: false },
    /** Accessible label for the control */
    ariaLabel: { type: String, default: 'Complete' }
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
  // Width/height driven by a CSS custom property set inline by the consumer
  // via the `size` prop (WEB-W2-41). Keeps layout declarations in the
  // stylesheet rather than inline binding.
  width: var(--checkbox-size, 20px);
  height: var(--checkbox-size, 20px);

  @apply grid place-items-center rounded-pill border transition-colors disabled:opacity-50;
  @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;

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
