<template>
  <label class="text-field">
    <span v-if="label" class="text-field__label">
      {{ label }}
    </span>

    <span
      class="text-field__wrapper"
      :class="invalid ? 'text-field__wrapper--invalid' : 'text-field__wrapper--valid'"
    >
      <Icon
        v-if="icon"
        :name="icon"
        :size="16"
        class="text-field__icon"
      />

      <input
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :value="modelValue"
        class="text-field__input"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    </span>
  </label>
</template>

<script>
/** TextField — labeled text input with optional leading icon and validation state. */
import Icon from './Icon.vue'

export default {
  name: 'TextField',
  components: { Icon },
  props: {
    /** Input value (v-model) */
    modelValue: { type: String, default: '' },
    /** Native input type */
    type: { type: String, default: 'text' },
    /** Placeholder text */
    placeholder: { type: String, default: '' },
    /** Label text shown above the input */
    label: { type: String, default: '' },
    /** Leading icon name; empty for none */
    icon: { type: String, default: '' },
    /** Show invalid (error) border state */
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
