<template>
  <label class="text-field">
    <!-- Label -->
    <span v-if="label" class="text-field__label">
      {{ label }}
    </span>

    <!-- Input wrapper with validation border -->
    <span
      class="text-field__wrapper"
      :class="invalid ? 'text-field__wrapper--invalid' : 'text-field__wrapper--valid'"
    >
      <!-- Leading icon -->
      <AppIcon
        v-if="icon"
        :name="icon"
        :size="16"
        class="text-field__icon"
      />

      <!-- Input -->
      <input
        v-bind="$attrs"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :value="modelValue"
        :aria-invalid="invalid || undefined"
        class="text-field__input"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    </span>
  </label>
</template>

<script>
/**
 * AppTextField — labeled text input with optional leading icon and validation
 * state.
 *
 * Pass any additional native input attribute via `$attrs` (autocomplete,
 * required, minlength, maxlength, inputmode, autofocus, name, id, etc.).
 * `inheritAttrs: false` keeps them off the wrapping `<label>` and routes
 * them onto the `<input>`. `invalid` toggles both the
 * border style and `aria-invalid` for assistive tech.
 */
import AppIcon from './AppIcon.vue'

// Standard HTML input types accepted by the validator. Keep this in sync
// with the consumers — adding a new type is a deliberate change.
const VALID_INPUT_TYPES = [
  'text',
  'password',
  'email',
  'number',
  'search',
  'tel',
  'url',
  'date',
  'datetime-local',
  'month',
  'time',
  'week',
  'color'
]

export default {
  name: 'AppTextField',
  components: { AppIcon },
  inheritAttrs: false,
  props: {
    /** Input value (v-model) */
    modelValue: { type: String, default: '' },
    /** Native input type */
    type: {
      type: String,
      default: 'text',
      validator: v => VALID_INPUT_TYPES.includes(v)
    },
    /** Placeholder text */
    placeholder: { type: String, default: '' },
    /** Label text shown above the input */
    label: { type: String, default: '' },
    /** Leading icon name; empty for none */
    icon: { type: String, default: '' },
    /** Show invalid (error) border state and set `aria-invalid` on the input. */
    invalid: { type: Boolean, default: false },
    /** Whether the input is disabled */
    disabled: { type: Boolean, default: false }
  },
  emits: ['update:modelValue']
}
</script>

<style lang="scss" scoped>
.text-field {
  @apply flex flex-col gap-1.5;

  &__label {
    @apply text-[12px] font-medium text-muted;
  }

  &__wrapper {
    @apply flex items-center gap-2 rounded-md border bg-paper-2 px-3.5 py-2.5 transition-colors focus-within:border-muted;

    &--valid {
      @apply border-rule-soft;
    }

    &--invalid {
      @apply border-bad;
    }
  }

  &__icon {
    @apply text-muted;
  }

  &__input {
    @apply min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-muted disabled:opacity-50;
  }
}
</style>
