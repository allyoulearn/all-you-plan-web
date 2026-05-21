<script setup>
defineProps({
  variant: { type: String, default: 'default' },
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[11px] font-medium"
    :class="{
      'bg-paper-3 text-ink-2': variant === 'default' || variant === 'dot',
      'bg-accent text-accent-ink': variant === 'accent',
      'border border-rule-soft bg-transparent text-muted': variant === 'soft',
    }"
  >
    <span v-if="variant === 'dot'" class="h-1.5 w-1.5 rounded-pill bg-accent" />
    <slot />
  </span>
</template>
