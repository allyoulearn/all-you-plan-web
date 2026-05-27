<template>
  <div class="chores-skeleton" role="status" :aria-label="ariaLabel">
    <div v-for="n in count" :key="n" class="chores-skeleton__row">
      <div class="chores-skeleton__check" />
      <div class="chores-skeleton__body">
        <div class="chores-skeleton__title" />
        <div class="chores-skeleton__meta" />
      </div>
      <div class="chores-skeleton__pill" />
    </div>
  </div>
</template>

<script>
/** ChoresSkeleton — N placeholder rows while chores load. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export default {
  name: 'ChoresSkeleton',
  props: {
    count: { type: Number, default: 4 }
  },
  setup() {
    const { t } = useI18n()
    const ariaLabel = computed(() => t('common.loading'))
    return { ariaLabel }
  }
}
</script>

<style lang="scss" scoped>
.chores-skeleton {
  @apply rounded-md bg-paper-2 px-2.5 py-1 shadow-sm;

  &__row {
    @apply flex items-center gap-3.5 px-2 py-3;
  }

  &__check {
    @apply h-4 w-4 rounded-sm bg-rule-soft animate-pulse;
  }

  &__body {
    @apply flex flex-1 flex-col gap-1.5;
  }

  &__title {
    @apply h-3 w-1/2 rounded-sm bg-rule-soft animate-pulse;
  }

  &__meta {
    @apply h-2 w-1/3 rounded-sm bg-rule-soft animate-pulse opacity-70;
  }

  &__pill {
    @apply h-4 w-16 rounded-pill bg-rule-soft animate-pulse;
  }
}
</style>
