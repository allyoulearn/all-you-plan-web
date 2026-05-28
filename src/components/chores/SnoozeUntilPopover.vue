<template>
  <div class="snooze-until-popover" role="dialog" :aria-label="t('chores.snoozeUntilTitle')">
    <div class="snooze-until-popover__label">
      <span class="snooze-until-popover__label-text">
        {{ t('chores.snoozeUntilTitle') }}
      </span>

      <AppDatePicker
        v-model="value"
        :min-date="minDate"
      />
    </div>

    <div class="snooze-until-popover__actions">
      <button
        type="button"
        class="snooze-until-popover__cancel"
        @click="$emit('cancel')"
      >
        {{ t('common.cancel') }}
      </button>

      <button
        type="button"
        class="snooze-until-popover__confirm"
        :disabled="!value"
        @click="confirm"
      >
        {{ t('common.confirm') }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDatePicker from '@/components/ui/AppDatePicker.vue'

export default {
  name: 'SnoozeUntilPopover',
  components: { AppDatePicker },
  emits: ['confirm', 'cancel'],
  setup(_, { emit }) {
    const { t } = useI18n()
    const value = ref('')

    const minDate = computed(() => {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      return d
    })

    return { t, value, minDate, confirm }

    function confirm() {
      if (!value.value) return
      emit('confirm', value.value)
    }
  }
}
</script>

<style lang="scss" scoped>
.snooze-until-popover {
  @apply z-30 flex flex-col gap-3 rounded-md border border-rule-soft bg-paper p-3 shadow-md;
  min-width: 220px;

  &__label {
    @apply flex flex-col gap-1.5;
  }

  &__label-text {
    @apply text-[12px] font-medium text-muted;
  }

  &__input {
    @apply rounded-sm border border-rule-soft bg-paper-2 px-2 py-1 text-[13px] text-ink;
  }

  &__actions {
    @apply flex justify-end gap-2;
  }

  &__cancel {
    @apply rounded-sm px-2 py-1 text-[12px] text-muted hover:bg-paper-2;
  }

  &__confirm {
    @apply rounded-sm bg-ink px-2 py-1 text-[12px] font-medium text-paper disabled:opacity-50;
  }
}
</style>
