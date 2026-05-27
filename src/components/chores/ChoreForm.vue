<template>
  <form class="chore-form" @submit.prevent>
    <AppTextField
      :model-value="modelValue.title"
      :label="t('tasks.title')"
      :placeholder="t('chores.titlePlaceholder')"
      :invalid="submitted && !modelValue.title.trim()"
      @update:model-value="patch({ title: $event })"
    />

    <label class="chore-form__field">
      <span class="chore-form__label">
        {{ t('chores.cadenceLabel') }}
      </span>

      <AppSegmentedControl
        :model-value="modelValue.cadence.type"
        :options="cadenceOptions"
        :group-label="t('chores.cadenceLabel')"
        @update:model-value="onCadenceTypeChange"
      />
    </label>

    <div v-if="modelValue.cadence.type === 'weekly'" class="chore-form__field">
      <span class="chore-form__label">
        {{ t('chores.daysOfWeekLabel') }}
      </span>

      <div class="chore-form__dow">
        <button
          v-for="(label, idx) in dayLabels"
          :key="idx"
          type="button"
          class="chore-form__dow-btn"
          :class="modelValue.cadence.daysOfWeek.includes(idx) ? 'chore-form__dow-btn--active' : ''"
          :aria-pressed="modelValue.cadence.daysOfWeek.includes(idx)"
          :aria-label="dayFullLabels[idx]"
          @click="toggleDay(idx)"
        >
          {{ label }}
        </button>
      </div>
    </div>

    <AppTextField
      v-if="modelValue.cadence.type === 'daily'"
      :model-value="String(modelValue.cadence.interval ?? 1)"
      type="number"
      :label="t('chores.intervalLabel')"
      placeholder="1"
      min="1"
      step="1"
      :invalid="submitted && !cadenceValid"
      @update:model-value="patch({ cadence: { ...modelValue.cadence, interval: Number($event) } })"
    />

    <AppTextField
      v-if="modelValue.cadence.type === 'monthly'"
      :model-value="String(modelValue.cadence.dayOfMonth ?? 1)"
      type="number"
      :label="t('chores.dayOfMonthLabel')"
      placeholder="1"
      min="1"
      max="31"
      step="1"
      :invalid="submitted && !cadenceValid"
      @update:model-value="patch({ cadence: { ...modelValue.cadence, dayOfMonth: Number($event) } })"
    />

    <label class="chore-form__active">
      <input
        type="checkbox"
        :checked="modelValue.active"
        @change="patch({ active: $event.target.checked })"
      />

      <span>
        {{ t('chores.activeLabel') }}
      </span>
    </label>

    <p class="chore-form__preview" aria-live="polite">
      {{ t('chores.cadencePreview', { value: previewLabel }) }}
    </p>
  </form>
</template>

<script>
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppTextField from '@/components/ui/AppTextField.vue'
import AppSegmentedControl from '@/components/ui/AppSegmentedControl.vue'
import { cadenceLabel } from '@/utils/chores.js'

export default {
  name: 'ChoreForm',
  components: { AppTextField, AppSegmentedControl },
  props: {
    modelValue: { type: Object, required: true },
    submitted: { type: Boolean, default: false }
  },
  emits: ['update:modelValue', 'valid'],
  setup(props, { emit }) {
    const { t } = useI18n()

    const cadenceOptions = computed(() => [
      { value: 'daily', label: t('chores.cadenceDaily') },
      { value: 'weekly', label: t('chores.cadenceWeekly') },
      { value: 'monthly', label: t('chores.cadenceMonthly') }
    ])

    const dayLabels = computed(() => [
      t('chores.dayShortSun'),
      t('chores.dayShortMon'),
      t('chores.dayShortTue'),
      t('chores.dayShortWed'),
      t('chores.dayShortThu'),
      t('chores.dayShortFri'),
      t('chores.dayShortSat')
    ])

    const dayFullLabels = computed(() => [
      t('chores.dayFullSun'),
      t('chores.dayFullMon'),
      t('chores.dayFullTue'),
      t('chores.dayFullWed'),
      t('chores.dayFullThu'),
      t('chores.dayFullFri'),
      t('chores.dayFullSat')
    ])

    const cadenceValid = computed(() => {
      const c = props.modelValue.cadence
      if (c.type === 'weekly') return c.daysOfWeek.length > 0

      if (c.type === 'monthly') {
        return Number.isInteger(c.dayOfMonth) && c.dayOfMonth >= 1 && c.dayOfMonth <= 31
      }

      if (c.type === 'daily') {
        return Number.isInteger(c.interval) && c.interval >= 1
      }

      return true
    })

    const previewLabel = computed(() => cadenceLabel(props.modelValue.cadence, t))

    watch(
      () => ({ valid: !!props.modelValue.title.trim() && cadenceValid.value }),
      v => emit('valid', v.valid),
      { immediate: true }
    )

    return {
      t, cadenceOptions, dayLabels, dayFullLabels, cadenceValid, previewLabel,
      patch, toggleDay, onCadenceTypeChange
    }

    function patch(partial) {
      emit('update:modelValue', { ...props.modelValue, ...partial })
    }

    function toggleDay(idx) {
      const days = props.modelValue.cadence.daysOfWeek

      const next = days.includes(idx)
        ? days.filter(d => d !== idx)
        : [...days, idx].sort((a, b) => a - b)

      patch({ cadence: { ...props.modelValue.cadence, daysOfWeek: next } })
    }

    function onCadenceTypeChange(type) {
      const cadence = {
        type,
        daysOfWeek: type === 'weekly' ? [1, 2, 3, 4, 5] : [],
        interval: 1,
        dayOfMonth: type === 'monthly' ? 1 : null
      }

      patch({ cadence })
    }
  }
}
</script>

<style lang="scss" scoped>
.chore-form {
  @apply flex flex-col gap-3.5;

  &__field {
    @apply flex flex-col gap-1.5;
  }

  &__label {
    @apply text-[12px] font-medium text-muted;
  }

  &__dow {
    @apply flex gap-1.5;
  }

  &__dow-btn {
    @apply inline-flex h-9 w-9 items-center justify-center rounded-pill border border-rule-soft bg-paper-2 text-[12px] font-medium text-ink transition-colors hover:bg-paper-3;
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;

    &--active {
      @apply bg-ink text-paper border-ink;
    }
  }

  &__active {
    @apply inline-flex items-center gap-2 text-[13px] text-ink;
  }

  &__preview {
    @apply text-[12px] text-muted;
  }
}
</style>
