<template>
  <div class="friction-input">
    <textarea
      class="friction-input__textarea"
      rows="3"
      maxlength="1000"
      :placeholder="t('review.friction.placeholder')"
      :value="modelValue.text"
      @input="onTextInput"
    />

    <p v-if="showCounter" class="friction-input__counter">
      {{ remaining }}
    </p>

    <div class="friction-input__chips">
      <button
        v-for="tag in TAGS"
        :key="tag"
        type="button"
        class="friction-input__chip"
        :class="{ 'friction-input__chip--active': isActive(tag) }"
        :aria-pressed="isActive(tag) ? 'true' : 'false'"
        @click="toggleTag(tag)"
      >
        {{ t(`review.friction.tag.${tag}`) }}
      </button>
    </div>
  </div>
</template>

<script>
/** FrictionInput — auto-grow textarea + chip row for end-of-day friction. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const TAGS = ['meetings', 'energy', 'scope', 'surprise', 'context-switch']
const MAX = 1000

export default {
  name: 'FrictionInput',
  props: {
    modelValue: {
      type: Object,
      required: true,
      validator: v => v && typeof v.text === 'string' && Array.isArray(v.tags)
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()

    const showCounter = computed(() => props.modelValue.text.length >= 800)
    const remaining = computed(() => `${MAX - props.modelValue.text.length} characters left`)

    return { t, TAGS, showCounter, remaining, isActive, toggleTag, onTextInput }

    function isActive(tag) {
      return props.modelValue.tags.includes(tag)
    }

    function toggleTag(tag) {
      const tags = [...props.modelValue.tags]
      const idx = tags.indexOf(tag)
      if (idx >= 0) tags.splice(idx, 1)
      else tags.push(tag)
      emit('update:modelValue', { ...props.modelValue, tags })
    }

    function onTextInput(e) {
      emit('update:modelValue', { ...props.modelValue, text: e.target.value })
    }
  }
}
</script>

<style lang="scss" scoped>
.friction-input {
  &__textarea {
    @apply w-full resize-y rounded-md border border-rule-soft bg-paper px-3 py-2 text-[14px] text-ink;
    @apply min-h-[5rem] max-h-[18rem];
    @apply focus:border-accent focus:outline-none;
  }

  &__counter {
    @apply mt-1 text-right font-mono text-[11px] text-muted;
  }

  &__chips {
    @apply mt-3 flex flex-wrap gap-2;
  }

  &__chip {
    @apply rounded-pill border border-rule-soft bg-paper-2 px-3 py-1 text-[12px] text-ink;
    @apply hover:border-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;

    &--active {
      @apply border-accent bg-accent text-accent-ink;
    }
  }
}
</style>
