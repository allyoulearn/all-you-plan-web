<template>
  <div class="category-filter">
    <!-- All -->
    <button
      type="button"
      class="category-filter__chip"
      :class="{ 'category-filter__chip--active': modelValue === null }"
      @click="$emit('update:modelValue', null)"
    >
      {{ t('tasksWorkspace.all') }}
      <span class="category-filter__count">
        {{ allCount }}
      </span>
    </button>

    <!-- One chip per present category -->
    <button
      v-for="cat in categories"
      :key="cat.id"
      type="button"
      class="category-filter__chip"
      :class="{ 'category-filter__chip--active': modelValue === cat.id }"
      @click="$emit('update:modelValue', cat.id)"
    >
      {{ cat.label }}
      <span class="category-filter__count">
        {{ cat.count }}
      </span>
    </button>
  </div>
</template>

<script>
/**
 * CategoryFilter — the "All {n}" pill plus one pill per present category, each
 * with a mono count. The active pill renders with an ink background. v-model is
 * the active category id (or null for "All").
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export default {
  name: 'CategoryFilter',
  props: {
    /** Active category id, or null for "All" (v-model). */
    modelValue: { type: String, default: null },
    /** Present categories: [{ id, label, count }]. */
    categories: { type: Array, default: () => [] }
  },
  emits: ['update:modelValue'],
  setup(props) {
    const { t } = useI18n()

    /** "All" count is the sum of every present category's count. */
    const allCount = computed(() => props.categories.reduce((sum, c) => sum + c.count, 0))

    return { t, allCount }
  }
}
</script>

<style lang="scss" scoped>
.category-filter {
  @apply mb-6 flex flex-wrap gap-2;

  &__chip {
    @apply inline-flex items-center gap-[7px] rounded-pill border border-rule-soft bg-paper-2 px-[13px] py-1.5 text-[13px] font-medium text-ink-2 transition-colors hover:border-muted;
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;

    &--active {
      @apply border-ink text-paper;
      background-color: var(--ink);
    }
  }

  &__count {
    @apply font-mono text-[10px] text-muted;
  }

  &__chip--active &__count {
    color: color-mix(in oklab, var(--paper) 65%, transparent);
  }
}
</style>
