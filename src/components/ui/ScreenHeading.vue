<template>
  <header class="mb-7 flex items-end gap-[18px] pb-6">
    <div class="flex-1">
      <p
        v-if="eyebrow"
        class="mb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted"
      >
        {{ eyebrow }}
      </p>

      <h1 class="font-serif text-[44px] font-normal leading-[0.95] tracking-[-0.02em] text-ink xl:text-[56px]">
        {{ title }}<em v-if="emphasis" class="italic">
          {{ emphasis }}
        </em>
      </h1>
    </div>

    <div v-if="$slots.meta" class="text-right text-[13px] leading-relaxed text-muted">
      <slot name="meta" />
    </div>
  </header>
</template>

<script setup>
defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, default: '' },
  emphasis: { type: String, default: '' },
})
</script>
