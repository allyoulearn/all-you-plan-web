<template>
  <div class="leftover-row">
    <span class="leftover-row__title">
      {{ task.title }}
    </span>

    <div class="leftover-row__chips">
      <button
        v-for="kind in KINDS"
        :key="kind"
        type="button"
        class="leftover-row__chip"
        :class="{ 'leftover-row__chip--active': action.kind === kind }"
        :aria-pressed="action.kind === kind ? 'true' : 'false'"
        @click="setKind(kind)"
      >
        {{ t(`review.leftover.action.${kind}`) }}
      </button>
    </div>

    <AppDatePicker
      v-if="action.kind === 'pick'"
      class="leftover-row__date"
      :model-value="action.date || ''"
      :placeholder="t('review.leftover.pickDayLabel')"
      @update:model-value="onDate"
    />
  </div>
</template>

<script>
/**
 * LeftoverRow — one pending-task row with action chips and an inline
 * date picker when the user chose "Pick day".
 */
import { useI18n } from 'vue-i18n'
import AppDatePicker from '@/components/ui/AppDatePicker.vue'

const KINDS = ['tomorrow', 'pick', 'drop', 'keep']

export default {
  name: 'LeftoverRow',
  components: { AppDatePicker },
  props: {
    task: { type: Object, required: true },
    action: {
      type: Object,
      required: true,
      validator: v => v && typeof v.kind === 'string'
    }
  },
  emits: ['update:action'],
  setup(_, { emit }) {
    const { t } = useI18n()
    return { t, KINDS, setKind, onDate }

    function setKind(kind) {
      if (kind === 'pick') emit('update:action', { kind: 'pick', date: '' })
      else emit('update:action', { kind })
    }

    function onDate(date) {
      emit('update:action', { kind: 'pick', date: date || '' })
    }
  }
}
</script>

<style lang="scss" scoped>
.leftover-row {
  @apply flex flex-wrap items-center gap-2 py-2;

  &__title {
    @apply flex-1 min-w-[10rem] text-[14px] text-ink;
  }

  &__chips {
    @apply flex flex-wrap gap-1.5;
  }

  &__chip {
    @apply rounded-pill border border-rule-soft bg-paper-2 px-3 py-1 text-[12px] text-ink;
    @apply hover:border-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;

    &--active {
      @apply border-accent bg-accent text-accent-ink;
    }
  }

  &__date {
    min-width: 180px;
  }
}
</style>
