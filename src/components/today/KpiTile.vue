<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  emphasis: { type: String, default: '' },
  unit: { type: String, default: '' },
})
</script>

<template>
  <div class="flex flex-col gap-1 rounded-md bg-paper-2 p-5 shadow-sm">
    <span class="text-[12px] font-medium text-muted">{{ label }}</span>
    <span class="mt-1.5 font-serif text-[40px] leading-none tracking-[-0.02em] text-ink">
      {{ value }}<em v-if="emphasis" class="italic">{{ emphasis }}</em>
    </span>
    <span v-if="unit" class="text-[12px] text-muted">{{ unit }}</span>
  </div>
</template>
