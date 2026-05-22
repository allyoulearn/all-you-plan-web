<template>
  <button
    :type="type"
    :disabled="disabled"
    class="grid place-items-center rounded-pill text-ink-2 transition-colors hover:text-ink disabled:opacity-50"
    :class="variant === 'ghost'
      ? 'bg-transparent hover:bg-paper-3'
      : 'bg-paper-2 border border-rule-soft hover:bg-paper-3'"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <Icon :name="icon" :size="Math.round(size * 0.47)" />
  </button>
</template>

<script setup>
import Icon from './Icon.vue'

defineProps({
  icon: { type: String, required: true },
  size: { type: Number, default: 34 },
  variant: { type: String, default: 'default' },
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
})
</script>
