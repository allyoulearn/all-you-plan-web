<template>
  <component
    :is="as"
    class="flex flex-col gap-2.5 rounded-md p-[22px]"
    :class="variant === 'accent'
      ? 'bg-accent text-accent-ink shadow-accent-glow'
      : 'bg-paper-2 text-ink shadow-sm'"
  >
    <slot />
  </component>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'default' },
  as: { type: String, default: 'div' },
})
</script>
