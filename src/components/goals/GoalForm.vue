<template>
  <form class="goal-form" @submit.prevent>
    <!-- Title -->
    <AppTextField
      :model-value="modelValue.title"
      :placeholder="t('goals.titlePlaceholder')"
      :invalid="submitted && !modelValue.title.trim()"
      class="goal-form__title"
      @update:model-value="patch({ title: $event })"
    />

    <!-- Why (multiline editorial field) -->
    <label class="goal-form__field">
      <span class="goal-form__eyebrow">
        {{ t('goals.whyLabel') }}
      </span>

      <textarea
        :value="modelValue.why"
        :placeholder="t('goals.whyPlaceholder')"
        :aria-invalid="submitted && !modelValue.why.trim() ? 'true' : undefined"
        class="goal-form__why"
        :class="submitted && !modelValue.why.trim() ? 'goal-form__why--invalid' : ''"
        rows="3"
        @input="patch({ why: $event.target.value })"
      />
    </label>

    <!-- Target date -->
    <label class="goal-form__field">
      <span class="goal-form__eyebrow">
        {{ t('goals.targetDateLabel') }}
      </span>

      <input
        type="date"
        :value="modelValue.targetDate"
        :aria-invalid="submitted && !dateValid ? 'true' : undefined"
        class="goal-form__date"
        :class="submitted && !dateValid ? 'goal-form__date--invalid' : ''"
        @input="patch({ targetDate: $event.target.value })"
      />
    </label>
  </form>
</template>

<script>
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppTextField from '@/components/ui/AppTextField.vue'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export default {
  name: 'GoalForm',
  components: { AppTextField },
  props: {
    modelValue: { type: Object, required: true },
    submitted: { type: Boolean, default: false }
  },
  emits: ['update:modelValue', 'valid'],
  setup(props, { emit }) {
    const { t } = useI18n()

    const dateValid = computed(() => DATE_RE.test(props.modelValue.targetDate || ''))

    const valid = computed(
      () =>
        !!props.modelValue.title.trim() &&
        !!props.modelValue.why.trim() &&
        dateValid.value
    )

    watch(valid, v => emit('valid', v), { immediate: true })

    return { t, dateValid, patch }

    function patch(partial) {
      emit('update:modelValue', { ...props.modelValue, ...partial })
    }
  }
}
</script>

<style lang="scss" scoped>
.goal-form {
  @apply flex flex-col gap-5;

  &__title :deep(.text-field__input) {
    @apply font-serif text-[22px];
  }

  &__field {
    @apply flex flex-col gap-1.5;
  }

  &__eyebrow {
    @apply font-mono uppercase text-muted;
    font-size: 11px;
    letter-spacing: 0.14em;
  }

  &__why {
    @apply min-h-[88px] resize-y rounded-md border border-rule-soft bg-paper-2 px-3.5 py-2.5 font-serif italic text-ink outline-none transition-colors;
    @apply focus:border-muted placeholder:text-muted placeholder:not-italic placeholder:font-sans;
    font-size: 18px;
    line-height: 1.4;

    &--invalid {
      @apply border-bad;
    }
  }

  &__date {
    @apply rounded-md border border-rule-soft bg-paper-2 px-3.5 py-2.5 font-mono text-[14px] text-ink outline-none transition-colors;
    @apply focus:border-muted;

    &--invalid {
      @apply border-bad;
    }
  }
}
</style>
