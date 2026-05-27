<template>
  <div class="tomorrow-intent">
    <input
      type="text"
      class="tomorrow-intent__input"
      maxlength="80"
      :placeholder="t('review.intent.placeholder')"
      :value="modelValue"
      @input="onInput"
    />

    <p v-if="showCounter" class="tomorrow-intent__counter">
      {{ t('review.intent.counterRemaining', { n: remaining }) }}
    </p>
  </div>
</template>

<script>
/** TomorrowIntent — single-line input for tomorrow's one-thing. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const MAX = 80

export default {
  name: 'TomorrowIntent',
  props: {
    modelValue: { type: String, default: '' }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const showCounter = computed(() => props.modelValue.length >= 60)
    const remaining = computed(() => MAX - props.modelValue.length)
    return { t, showCounter, remaining, onInput }

    function onInput(e) {
      emit('update:modelValue', e.target.value)
    }
  }
}
</script>

<style lang="scss" scoped>
.tomorrow-intent {
  &__input {
    @apply w-full rounded-md border border-rule-soft bg-paper px-3 py-2 text-[14px] text-ink;
    @apply focus:border-accent focus:outline-none;
  }

  &__counter {
    @apply mt-1 text-right font-mono text-[11px] text-muted;
  }
}
</style>
