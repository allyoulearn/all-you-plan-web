<template>
  <button
    type="button"
    :disabled="disabled"
    class="grid place-items-center rounded-pill border transition-colors disabled:opacity-50"
    :class="modelValue
      ? 'border-accent bg-accent'
      : 'border-rule-soft bg-paper-2 hover:border-muted'"
    :style="{ width: `${size}px`, height: `${size}px` }"
    @click="toggle"
  >
    <Icon
      v-if="modelValue"
      name="check"
      :size="Math.round(size * 0.6)"
      class="text-accent-ink"
    />
  </button>
</template>

<script setup>
import Icon from './Icon.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  size: { type: Number, default: 20 },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

function toggle() {
  if (!props.disabled) emit('update:modelValue', !props.modelValue)
}
</script>
