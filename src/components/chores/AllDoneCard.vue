<template>
  <div class="all-done-card" role="status">
    <AppIcon name="check" :size="20" class="all-done-card__icon" />

    <div class="all-done-card__text">
      <span class="all-done-card__title">
        {{ t('chores.allDoneTitle') }}
      </span>

      <span class="all-done-card__sub">
        {{ t('chores.allDoneSub') }}
      </span>
    </div>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'

export default {
  name: 'AllDoneCard',
  components: { AppIcon },
  setup() {
    const { t } = useI18n()
    return { t }
  }
}
</script>

<style lang="scss" scoped>
.all-done-card {
  @apply flex items-center gap-3 rounded-md bg-paper-2 px-4 py-4 shadow-sm;

  &__icon {
    @apply text-ok;
  }

  &__text {
    @apply flex flex-col;
  }

  &__title {
    @apply text-[14px] font-medium text-ink;
  }

  &__sub {
    @apply mt-0.5 text-[12px] text-muted;
  }
}
</style>
