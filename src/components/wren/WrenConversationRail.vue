<template>
  <nav class="wren-rail" :aria-label="t('wren.conversationListAriaLabel')">
    <div class="wren-rail__header">
      <p class="wren-rail__heading">
        {{ t('wren.conversationsHeading') }}
      </p>

      <button
        type="button"
        class="wren-rail__new-btn"
        :aria-label="t('wren.newConversationAriaLabel')"
        @click="$emit('create')"
      >
        <PlusIcon class="wren-rail__new-icon" aria-hidden="true" />

        <span>
          {{ t('wren.newConversation') }}
        </span>
      </button>
    </div>

    <ul class="wren-rail__list">
      <li v-for="conv in conversations" :key="conv.id">
        <button
          type="button"
          class="wren-rail__item"
          :class="{ 'wren-rail__item--active': conv.id === activeId }"
          :aria-current="conv.id === activeId ? 'true' : undefined"
          :aria-label="t('wren.switchConversationAriaLabel', { title: conv.title })"
          @click="$emit('select', conv.id)"
        >
          <p class="wren-rail__item-title">
            {{ conv.title }}
          </p>

          <p v-if="conv.preview" class="wren-rail__item-preview">
            {{ conv.preview }}
          </p>

          <p class="wren-rail__item-meta">
            {{ formatRelative(conv.updatedAt) }}
          </p>
        </button>
      </li>
    </ul>
  </nav>
</template>

<script>
/**
 * WrenConversationRail — left rail listing the user's Wren conversations,
 * with a button to start a new one. Rendered by WrenView; emits `create`
 * and `select(id)` so the view can wire to the store.
 */
import { PlusIcon } from '@heroicons/vue/24/outline'
import { useI18n } from 'vue-i18n'

export default {
  name: 'WrenConversationRail',
  components: { PlusIcon },
  props: {
    conversations: { type: Array, required: true },
    activeId: { type: String, default: null }
  },
  emits: ['create', 'select'],
  setup() {
    const { t } = useI18n()
    return { t, formatRelative }

    /**
     * Short human-friendly relative timestamp for the rail. Falls back to a
     * locale date when the gap is older than ~7 days.
     * @param {string|null} iso
     * @returns {string}
     */
    function formatRelative(iso) {
      if (!iso) return ''

      try {
        const then = new Date(iso).getTime()
        if (Number.isNaN(then)) return ''
        const now = Date.now()
        const diffMs = now - then
        const minute = 60_000
        const hour = 60 * minute
        const day = 24 * hour
        if (diffMs < minute) return 'now'
        if (diffMs < hour) return `${Math.floor(diffMs / minute)}m`
        if (diffMs < day) return `${Math.floor(diffMs / hour)}h`
        if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}d`
        return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      } catch {
        return ''
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.wren-rail {
  @apply flex w-full flex-col gap-3;

  &__header {
    @apply flex flex-col gap-2;
  }

  &__heading {
    @apply font-mono text-[11px] uppercase tracking-[0.14em] text-muted;
  }

  &__new-btn {
    @apply inline-flex items-center gap-2 rounded-pill border border-rule-soft bg-paper-2 px-3 py-2 text-[12px] font-medium text-ink transition-colors;
    @apply hover:bg-paper-3;
  }

  &__new-icon {
    @apply h-4 w-4;
  }

  &__list {
    @apply flex flex-col gap-1.5;
  }

  &__item {
    @apply flex w-full flex-col gap-1 rounded-xl border border-transparent bg-transparent px-3 py-2.5 text-left transition-colors;
    @apply hover:bg-paper-2;

    &--active {
      @apply border-rule-soft bg-paper-2;
    }
  }

  &__item-title {
    @apply truncate text-[13px] font-medium text-ink;
  }

  &__item-preview {
    @apply line-clamp-2 text-[12px] leading-snug text-muted;
  }

  &__item-meta {
    @apply font-mono text-[10px] uppercase tracking-wider text-muted;
  }
}
</style>
