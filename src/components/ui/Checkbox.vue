<template>
  <button
    type="button"
    role="checkbox"
    :aria-checked="modelValue"
    :aria-label="ariaLabel"
    :disabled="disabled"
    class="checkbox"
    :class="[
      modelValue ? 'checkbox--checked' : 'checkbox--unchecked',
      { 'checkbox--just-checked': justChecked }
    ]"
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
 *
 * Pulse animation: a transient `--just-checked` class is applied when
 * `modelValue` transitions from false to true, driving a keyframe scale-pulse
 * (scale 1 → 1.18 → 1). Initial mount with `modelValue: true` does NOT pulse —
 * only the user-initiated transition does. The pulse bulges ~2px into the
 * surrounding margin via CSS `transform` (no reflow), so consumers should
 * keep at least `gap-2` around the control to avoid overlap.
 */
import { ref, watch, onBeforeUnmount } from 'vue'
import Icon from './Icon.vue'

// Slightly exceeds the 280ms CSS keyframe so the class survives the full
// animation; matching the two risks a snap-back if class removal lands a
// frame early.
const PULSE_MS = 320

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
    const justChecked = ref(false)
    let pulseTimer = null

    watch(
      () => props.modelValue,
      (val, prev) => {
        // prev is undefined on the initial-value skip; treated as falsy
        // intentionally so first-mount-with-true does not pulse.
        if (val && !prev) {
          justChecked.value = true
          if (pulseTimer) clearTimeout(pulseTimer)
          pulseTimer = setTimeout(() => {
            justChecked.value = false
            pulseTimer = null
          }, PULSE_MS)
        }
      }
    )

    onBeforeUnmount(() => {
      if (pulseTimer) clearTimeout(pulseTimer)
    })

    return { toggle, justChecked }

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

@media (prefers-reduced-motion: no-preference) {
  .checkbox--just-checked {
    animation: checkbox-pop 280ms ease-out;
  }

  .checkbox--just-checked .checkbox__icon {
    animation: checkbox-icon-pop 160ms ease-out;
  }

  @keyframes checkbox-pop {
    0%   { transform: scale(1); }
    35%  { transform: scale(1.18); }
    100% { transform: scale(1); }
  }

  @keyframes checkbox-icon-pop {
    0%   { transform: scale(0.6); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
}
</style>
