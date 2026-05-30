<template>
  <div class="wren-turn">
    <div class="wren-turn__header">
      <AppIcon name="sparkles" :size="16" class="wren-turn__mark" />

      <p class="wren-turn__prompt">
        {{ prompt }}
      </p>
    </div>

    <p v-if="callout" class="wren-turn__callout">
      {{ callout }}
    </p>

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
// Default WrenTurn: typographic only — italic serif prompt + small accent
// mark + optional callout. No card chrome. Each section reads as a turn in
// a conversation rather than a stacked block. The SendoffCard layers its
// own card chrome on top via `.wren-turn--card` when used as the closer.
.wren-turn {
  @apply mb-2;

  &__header {
    @apply flex items-start gap-2;
  }

  &__mark {
    @apply mt-1 shrink-0 text-accent opacity-80;
  }

  &__prompt {
    @apply font-serif text-[18px] italic leading-snug text-ink;
  }

  &__callout {
    @apply mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted;
  }

  &__body {
    @apply mt-3;
  }
}
</style>
