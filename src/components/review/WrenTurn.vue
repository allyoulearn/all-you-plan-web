<template>
  <div class="wren-turn">
    <div class="wren-turn__header">
      <AppIcon name="sparkles" :size="16" class="wren-turn__mark" />
      <p class="wren-turn__prompt">{{ prompt }}</p>
    </div>

    <p v-if="callout" class="wren-turn__callout">{{ callout }}</p>

    <div v-if="$slots.default" class="wren-turn__body">
      <slot />
    </div>
  </div>
</template>

<script>
/** WrenTurn — reusable Wren-prompt visual used by every review section. */
import AppIcon from '@/components/ui/AppIcon.vue'

export default {
  name: 'WrenTurn',
  components: { AppIcon },
  props: {
    prompt: { type: String, required: true },
    callout: { type: String, default: '' }
  }
}
</script>

<style lang="scss" scoped>
.wren-turn {
  @apply mb-3 rounded-md bg-accent p-4 text-accent-ink shadow-accent-glow;

  &__header {
    @apply flex items-start gap-2;
  }

  &__mark {
    @apply mt-1 shrink-0 opacity-90;
  }

  &__prompt {
    @apply font-serif text-[18px] italic leading-snug;
  }

  &__callout {
    @apply mt-2 font-mono text-[11px] uppercase tracking-[0.14em] opacity-80;
  }

  &__body {
    @apply mt-3;
  }
}
</style>
