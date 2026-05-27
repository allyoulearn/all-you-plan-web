<template>
  <div class="mood-picker" role="radiogroup" :aria-label="t('review.wren.open')">
    <AppButton
      v-for="m in MOODS"
      :key="m"
      role="radio"
      :aria-checked="modelValue === m ? 'true' : 'false'"
      :variant="modelValue === m ? 'accent' : 'default'"
      size="md"
      @click="$emit('update:modelValue', m)"
    >
      {{ t(`review.mood.${m}`) }}
    </AppButton>
  </div>
</template>

<script>
/** MoodPicker — 5-pill mood scale with single-select radiogroup semantics. */
import { useI18n } from 'vue-i18n'
import AppButton from '@/components/ui/AppButton.vue'

const MOODS = ['heavy', 'low', 'steady', 'good', 'lit']

export default {
  name: 'MoodPicker',
  components: { AppButton },
  props: {
    modelValue: { type: String, default: '' }
  },
  emits: ['update:modelValue'],
  setup() {
    const { t } = useI18n()
    return { t, MOODS }
  }
}
</script>

<style lang="scss" scoped>
.mood-picker {
  @apply flex flex-wrap gap-3;
}
</style>
