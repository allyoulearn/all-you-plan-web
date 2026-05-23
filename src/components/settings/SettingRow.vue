<template>
  <div class="setting-row">
    <div>
      <p class="setting-row__label">
        {{ label }}
      </p>

      <p v-if="description" class="setting-row__description">
        {{ description }}
      </p>
    </div>

    <div />

    <div class="setting-row__control">
      <slot />
    </div>
  </div>
</template>

<script>
/** SettingRow — three-column grid row for a settings item with label, description, and control slot. */

export default {
  name: 'SettingRow',
  props: {
    /**
     * Primary label for the setting. Required and validated non-empty so a
     * missing localized string can't render an empty `<p>` (WEB-W3-19).
     */
    label: {
      type: String,
      required: true,
      validator: v => typeof v === 'string' && v.trim().length > 0
    },
    /** Optional supporting description displayed below the label */
    description: { type: String, default: '' }
  }
}
</script>

<style lang="scss" scoped>
.setting-row {
  @apply grid items-center gap-4 py-3.5;
  grid-template-columns: 240px 1fr auto;

  &__label {
    @apply text-[14px] font-medium text-ink;
  }

  &__description {
    @apply mt-0.5 text-[12px] leading-snug text-muted;
  }

  &__control {
    @apply flex items-center;
  }
}
</style>
