<template>
  <div class="section-header">
    <span class="section-header__label">
      {{ label }}
    </span>

    <span v-if="count != null" class="section-header__count">
      [{{ count }}]
    </span>

    <span class="section-header__rule" />

    <slot name="action" />
  </div>
</template>

<script>
/** SectionHeader — labeled divider row with optional item count and action slot. */

export default {
  name: 'SectionHeader',
  props: {
    /** Section label text */
    label: { type: String, required: true },
    /** Optional item count displayed in brackets */
    count: { type: Number, default: null }
  }
}
</script>

<style lang="scss" scoped>
.section-header {
  @apply mb-3 mt-8 flex items-baseline gap-3;

  &__label {
    @apply text-[13px] font-medium text-ink;
  }

  &__count {
    @apply font-mono text-[11px] text-muted;
  }

  &__rule {
    @apply flex-1 border-t border-rule-soft;
  }
}
</style>
