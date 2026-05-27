<template>
  <div class="chores-empty">
    <AppIcon name="sparkles" :size="32" class="chores-empty__icon" />

    <h2 class="chores-empty__title">
      {{ t('chores.emptyHeadline') }}
    </h2>

    <p class="chores-empty__sub">
      {{ t('chores.emptySub') }}
    </p>

    <AppButton variant="primary" icon="plus" @click="$emit('create')">
      {{ t('chores.newChore') }}
    </AppButton>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppButton from '@/components/ui/AppButton.vue'

export default {
  name: 'ChoresEmpty',
  components: { AppIcon, AppButton },
  emits: ['create'],
  setup() {
    const { t } = useI18n()
    return { t }
  }
}
</script>

<style lang="scss" scoped>
.chores-empty {
  @apply mx-auto mt-12 flex max-w-sm flex-col items-center gap-3 text-center;

  &__icon {
    @apply text-muted;
  }

  &__title {
    @apply font-serif text-[24px] tracking-[-0.01em] text-ink;
  }

  &__sub {
    @apply text-[13px] text-muted;
  }
}
</style>
