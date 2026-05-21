<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="inline-flex gap-0.5 rounded-md bg-paper-3 p-[3px]">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="inline-flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-[12.5px] font-medium transition-colors"
      :class="opt.value === modelValue
        ? 'bg-paper-2 text-ink shadow-sm'
        : 'text-muted hover:text-ink'"
      @click="$emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
      <span v-if="opt.count != null" class="font-mono text-[11px] text-muted">{{ opt.count }}</span>
    </button>
  </div>
</template>
