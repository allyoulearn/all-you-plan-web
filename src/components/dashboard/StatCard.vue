<template>
  <div class="stat-card" :class="`stat-card--${tone}`">
    <div class="stat-card__visual">
      <slot name="visual" />
    </div>
    <div class="stat-card__text">
      <p class="stat-card__value">
        <slot />
      </p>
      <p class="stat-card__label">{{ label }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatCard',
  props: {
    /** Short label shown under the value. */
    label: { type: String, required: true },
    /** Visual tone: 'default' or 'danger' (tints the border/background). */
    tone: {
      type: String,
      default: 'default',
      validator: (v) => ['default', 'danger'].includes(v),
    },
  },
}
</script>

<style lang="scss" scoped>
.stat-card {
  @apply flex items-center gap-3 px-4 py-3 rounded-glass border;
  @apply border-white/10 transition-all duration-150;
  background: rgba(255, 255, 255, 0.03);

  &--danger {
    border-color: rgba(255, 107, 107, 0.18);
    background: rgba(255, 107, 107, 0.04);
  }

  &__visual {
    @apply flex-shrink-0 flex items-center justify-center;
  }

  &__text {
    @apply flex flex-col min-w-0;
  }

  &__value {
    @apply text-xl font-bold text-white leading-none m-0 font-mono;
  }

  &__label {
    @apply text-xs text-secondary-400 m-0 mt-1 truncate;
  }
}
</style>
