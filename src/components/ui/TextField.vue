<script setup>
import Icon from './Icon.vue'

defineProps({
  modelValue: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  label: { type: String, default: '' },
  icon: { type: String, default: '' },
  invalid: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <label class="flex flex-col gap-1.5">
    <span v-if="label" class="text-[12px] font-medium text-muted">{{ label }}</span>
    <span
      class="flex items-center gap-2 rounded-md border bg-paper-2 px-3.5 py-2.5 transition-colors focus-within:border-muted"
      :class="invalid ? 'border-bad' : 'border-rule-soft'"
    >
      <Icon v-if="icon" :name="icon" :size="16" class="text-muted" />
      <input
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :value="modelValue"
        class="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-muted disabled:opacity-50"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    </span>
  </label>
</template>
