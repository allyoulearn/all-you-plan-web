<script setup>
defineProps({
  label: { type: String, required: true },
  count: { type: Number, default: null },
})
</script>

<template>
  <div class="mb-3 mt-8 flex items-baseline gap-3">
    <span class="text-[13px] font-medium text-ink">{{ label }}</span>
    <span v-if="count != null" class="font-mono text-[11px] text-muted">[{{ count }}]</span>
    <span class="flex-1 border-t border-rule-soft" />
    <slot name="action" />
  </div>
</template>
