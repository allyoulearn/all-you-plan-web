<template>
  <div class="win-picker">
    <p v-if="!tasks.length" class="win-picker__empty">
      {{ t('review.win.empty') }}
    </p>

    <ul v-else class="win-picker__list">
      <li
        v-for="task in tasks"
        :key="task.id"
        class="win-picker__row"
        :class="{ 'win-picker__row--starred': isStarred(task.id) }"
        :aria-pressed="isStarred(task.id) ? 'true' : 'false'"
        role="button"
        tabindex="0"
        @click="toggle(task.id)"
        @keydown.enter.prevent="toggle(task.id)"
        @keydown.space.prevent="toggle(task.id)"
      >
        <AppIcon
          name="star"
          :solid="isStarred(task.id)"
          :size="16"
          class="win-picker__icon"
          :aria-label="t(isStarred(task.id) ? 'review.win.unstar' : 'review.win.star')"
        />
        <span class="win-picker__title">{{ task.title }}</span>
      </li>
    </ul>

    <label class="win-picker__free-label">
      {{ t('review.win.freeTextLabel') }}
      <input
        type="text"
        class="win-picker__free-input"
        maxlength="280"
        :placeholder="t('review.win.freeTextPlaceholder')"
        :value="modelValue.freeText"
        @input="onFreeTextInput"
      />
    </label>
  </div>
</template>

<script>
/** WinPicker — star-toggle list of completed tasks plus a free-text field. */
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'

export default {
  name: 'WinPicker',
  components: { AppIcon },
  props: {
    tasks: { type: Array, required: true },
    modelValue: {
      type: Object,
      required: true,
      validator: v => v && Array.isArray(v.starred) && typeof v.freeText === 'string'
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()

    return { t, isStarred, toggle, onFreeTextInput }

    function isStarred(id) {
      return props.modelValue.starred.includes(id)
    }

    function toggle(id) {
      const starred = [...props.modelValue.starred]
      const idx = starred.indexOf(id)

      if (idx >= 0) {
        starred.splice(idx, 1)
      } else {
        starred.push(id)
        if (starred.length > 3) starred.shift()
      }

      emit('update:modelValue', { ...props.modelValue, starred })
    }

    function onFreeTextInput(e) {
      emit('update:modelValue', { ...props.modelValue, freeText: e.target.value })
    }
  }
}
</script>

<style lang="scss" scoped>
.win-picker {
  &__empty {
    @apply mb-3 text-[13px] text-muted;
  }

  &__list {
    @apply mb-3 flex flex-col gap-1;
  }

  &__row {
    @apply flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-[14px] text-ink;
    @apply hover:bg-paper-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;

    &--starred {
      @apply bg-accent text-accent-ink;
    }
  }

  &__icon {
    @apply shrink-0 opacity-80;
  }

  &__title {
    @apply flex-1;
  }

  &__free-label {
    @apply mt-2 block text-[12px] uppercase tracking-[0.12em] text-muted;
  }

  &__free-input {
    @apply mt-1 w-full rounded-md border border-rule-soft bg-paper px-3 py-2 text-[14px] text-ink;
    @apply focus:border-accent focus:outline-none;
  }
}
</style>
