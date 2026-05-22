<template>
  <div class="grid items-center gap-4 py-3.5" style="grid-template-columns: 240px 1fr auto">
    <div>
      <p class="text-[14px] font-medium text-ink">
        {{ label }}
      </p>

      <p v-if="description" class="mt-0.5 text-[12px] leading-snug text-muted">
        {{ description }}
      </p>
    </div>

    <div />

    <div class="flex items-center">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>
