<template>
  <label class="date-picker">
    <span v-if="label" class="date-picker__label">
      {{ label }}
    </span>

    <VueDatePicker
      :model-value="modelValue"
      :time-config="timeConfig"
      :model-type="modelType"
      :formats="formats"
      :input-attrs="inputAttrs"
      :config="config"
      :placeholder="placeholder"
      :min-date="minDate"
      :max-date="maxDate"
      :disabled="disabled"
      :auto-apply="autoApply"
      :teleport="true"
      :class="invalid ? 'date-picker__wrap date-picker__wrap--invalid' : 'date-picker__wrap'"
      :ui="ui"
      :dark="isDark"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </label>
</template>

<script>
import { computed } from 'vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { useTheme } from '@/composables/useTheme.js'

export default {
  name: 'AppDatePicker',
  components: { VueDatePicker },
  props: {
    modelValue: { type: String, default: '' },
    label: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    minDate: { type: [String, Date], default: null },
    maxDate: { type: [String, Date], default: null },
    invalid: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    autoApply: { type: Boolean, default: true },
    clearable: { type: Boolean, default: false },
    modelType: { type: String, default: 'yyyy-MM-dd' },
    format: { type: String, default: 'MMM d, yyyy' }
  },
  emits: ['update:modelValue'],
  setup(props) {
    const { mode } = useTheme()
    const isDark = computed(() => mode.value === 'dark')

    const ui = {
      menu: 'date-picker__menu',
      input: 'date-picker__input',
      calendar: 'date-picker__calendar',
      calendarCell: 'date-picker__cell'
    }

    const timeConfig = { enableTimePicker: false }
    const formats = computed(() => ({ input: props.format }))
    const inputAttrs = computed(() => ({ clearable: props.clearable }))
    const config = { monthChangeOnScroll: false }

    return { isDark, ui, timeConfig, formats, inputAttrs, config }
  }
}
</script>

<style lang="scss" scoped>
.date-picker {
  @apply flex flex-col gap-1.5;

  &__label {
    @apply text-[12px] font-medium text-muted;
  }
}
</style>

<style lang="scss">
/* Token-mapped overrides for @vuepic/vue-datepicker v13. The .dp--main and
 * .dp--menu selectors win over the .dp--theme-light/.dp--theme-dark variable
 * declarations because they are more specific to the instance.
 */
.dp--main,
.dp--menu {
  --dp-font-family: 'Instrument Sans', ui-sans-serif, system-ui, sans-serif;
  --dp-border-radius: 14px;
  --dp-cell-border-radius: 8px;
  --dp-font-size: 14px;
  --dp-preview-font-size: 13px;
  --dp-input-padding: 10px 14px 10px 38px;
  --dp-input-icon-padding: 36px;
  --dp-button-height: 32px;
  --dp-cell-size: 36px;
  --dp-cell-padding: 4px;
  --dp-common-padding: 10px;
  --dp-menu-min-width: 280px;
  --dp-menu-padding: 8px;
  --dp-action-buttons-padding: 4px 12px;
  --dp-action-button-height: 28px;
  --dp-action-row-padding: 8px 4px 4px;
  --dp-month-year-row-height: 36px;
  --dp-month-year-row-button-size: 28px;
  --dp-row-margin: 2px 0;

  --dp-background-color: var(--paper-2);
  --dp-text-color: var(--ink);
  --dp-hover-color: var(--paper-3);
  --dp-hover-text-color: var(--ink);
  --dp-hover-icon-color: var(--ink);
  --dp-primary-color: var(--accent);
  --dp-primary-disabled-color: color-mix(in oklab, var(--accent) 35%, transparent);
  --dp-primary-text-color: var(--accent-ink);
  --dp-secondary-color: var(--muted);
  --dp-border-color: var(--rule-soft);
  --dp-menu-border-color: var(--rule-soft);
  --dp-border-color-hover: var(--muted);
  --dp-border-color-focus: var(--muted);
  --dp-disabled-color: color-mix(in oklab, var(--paper-2) 60%, transparent);
  --dp-disabled-color-text: var(--muted);
  --dp-scroll-bar-background: var(--paper-2);
  --dp-scroll-bar-color: var(--rule-soft);
  --dp-success-color: var(--ok);
  --dp-success-color-disabled: color-mix(in oklab, var(--ok) 50%, transparent);
  --dp-icon-color: var(--muted);
  --dp-danger-color: var(--bad);
  --dp-marker-color: var(--accent);
  --dp-tooltip-color: var(--paper-3);
  --dp-highlight-color: color-mix(in oklab, var(--accent) 18%, transparent);
  --dp-range-between-dates-background-color: color-mix(in oklab, var(--accent) 12%, transparent);
  --dp-range-between-dates-text-color: var(--ink);
  --dp-range-between-border-color: var(--rule-soft);
}

/* Input shell — match AppTextField wrapper. */
.dp--main .date-picker__input,
.dp--main .dp--input {
  background-color: var(--paper-2);
  border: 1px solid var(--rule-soft);
  border-radius: 14px;
  color: var(--ink);
  font-family: var(--dp-font-family);
  font-size: 14px;
  line-height: 1.45;
  padding: 10px 14px 10px 38px;
  transition: border-color 150ms ease;

  &::placeholder {
    color: var(--muted);
    opacity: 1;
  }

  &:hover:not(.dp--input-focus) {
    border-color: var(--rule-soft);
  }

  &:focus,
  &.dp--input-focus {
    border-color: var(--muted);
    outline: none;
    box-shadow: none;
  }
}

.date-picker__wrap--invalid .dp--input {
  border-color: var(--bad);

  &:hover:not(.dp--input-focus) {
    border-color: var(--bad);
  }
}

.dp--input-icon {
  color: var(--muted);
}

/* Calendar popup — teleported to body. */
.date-picker__menu.dp--menu {
  border-radius: 14px;
  border: 1px solid var(--rule-soft);
  background-color: var(--paper-2);
  box-shadow:
    0 1px 2px rgba(20, 18, 12, 0.05),
    0 8px 24px rgba(20, 18, 12, 0.08);
  font-family: var(--dp-font-family);
  color: var(--ink);
  overflow: hidden;
}

.date-picker__menu .dp--calendar-header {
  color: var(--muted);
  font-weight: 500;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.date-picker__menu .dp--calendar-header-separator {
  background: var(--rule-soft);
}

.date-picker__menu .dp--month-year-select-base {
  color: var(--ink);
  font-weight: 500;
  border-radius: 8px;
  padding: 0 8px;

  &:hover {
    background-color: var(--paper-3);
  }
}

.date-picker__menu .dp--cell-inner {
  border-radius: 8px;
  color: var(--ink);
  font-variant-numeric: tabular-nums;

  &:hover {
    background-color: var(--paper-3);
  }
}

.date-picker__menu .dp--active {
  background-color: var(--accent);
  color: var(--accent-ink);

  &:hover {
    background-color: var(--accent);
  }
}

.date-picker__menu .dp--today {
  border: 1px solid var(--accent);
}

.date-picker__menu .dp--cell-offset {
  color: var(--muted);
  opacity: 0.5;
}

.date-picker__menu .dp--cell-disabled {
  color: var(--muted);
  opacity: 0.4;
}

.date-picker__menu .dp--action-row {
  gap: 8px;
}

.date-picker__menu .dp--action-button {
  border-radius: 999px;
  padding: 4px 14px;
  height: 28px;
  font-size: 13px;
  font-weight: 500;
}

.date-picker__menu .dp--action-cancel {
  background: transparent;
  color: var(--muted);
  border: 1px solid var(--rule-soft);

  &:hover {
    color: var(--ink);
    background-color: var(--paper-3);
    border-color: var(--rule-soft);
  }
}

.date-picker__menu .dp--action-buttons .dp--action-select {
  background-color: var(--accent);
  color: var(--accent-ink);
  border: 1px solid var(--accent);

  &:hover {
    background-color: var(--accent);
    filter: brightness(1.05);
  }
}

.date-picker__menu .dp--overlay {
  background-color: var(--paper-2);
  color: var(--ink);
}

.date-picker__menu .dp--overlay-cell,
.date-picker__menu .dp--overlay-cell-active {
  border-radius: 8px;
  color: var(--ink);
  background: transparent;

  &:hover {
    background-color: var(--paper-3);
    color: var(--ink);
  }
}

.date-picker__menu .dp--overlay-cell-active {
  background-color: var(--accent);
  color: var(--accent-ink);

  &:hover {
    background-color: var(--accent);
  }
}

.date-picker__menu .dp--arrow-top,
.date-picker__menu .dp--arrow-bottom {
  display: none;
}

.date-picker__menu .dp--inner-nav {
  color: var(--muted);

  &:hover {
    background-color: var(--paper-3);
    color: var(--ink);
  }
}

.date-picker__menu .dp--clear-btn {
  color: var(--muted);

  &:hover {
    color: var(--ink);
  }
}
</style>
