<template>
  <div class="goal-menu">
    <button
      ref="triggerRef"
      type="button"
      class="goal-menu__trigger"
      :aria-label="t('goals.actionsLabel')"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click.stop="open = !open"
    >
      <AppIcon name="more" :size="16" />
    </button>

    <ul
      v-if="open"
      ref="listRef"
      class="goal-menu__list"
      role="menu"
    >
      <li role="none">
        <button
          type="button"
          role="menuitem"
          class="goal-menu__item"
          @click="trigger('edit')"
        >
          {{ t('goals.edit') }}
        </button>
      </li>

      <li class="goal-menu__divider" aria-hidden="true" />

      <li role="none">
        <button
          type="button"
          role="menuitem"
          class="goal-menu__item goal-menu__item--danger"
          @click="trigger('remove')"
        >
          {{ t('goals.remove') }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'

export default {
  name: 'GoalCardMenu',
  components: { AppIcon },
  emits: ['edit', 'remove'],
  setup(_, { emit }) {
    const { t } = useI18n()
    const open = ref(false)
    const triggerRef = ref(null)
    const listRef = ref(null)

    onMounted(() => {
      document.addEventListener('click', onDocClick)
      document.addEventListener('keydown', onKey)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    })

    return { t, open, triggerRef, listRef, trigger }

    function trigger(action) {
      open.value = false
      emit(action)
    }

    function onDocClick(e) {
      if (!open.value) return
      if (triggerRef.value?.contains(e.target)) return
      if (listRef.value?.contains(e.target)) return
      open.value = false
    }

    function onKey(e) {
      if (e.key === 'Escape' && open.value) {
        e.stopPropagation()
        open.value = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.goal-menu {
  @apply relative shrink-0;

  &__trigger {
    @apply inline-flex h-7 w-7 items-center justify-center rounded-pill text-muted transition-colors hover:bg-paper-3 hover:text-ink;
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;
  }

  &__list {
    @apply absolute right-0 top-8 z-20 min-w-[160px] rounded-md border border-rule-soft bg-paper py-1 shadow-md;
  }

  &__item {
    @apply flex w-full items-center px-3 py-1.5 text-left text-[13px] text-ink transition-colors hover:bg-paper-2;
    @apply disabled:cursor-not-allowed disabled:text-muted disabled:opacity-60 disabled:hover:bg-transparent;

    &--danger {
      @apply text-bad;
    }
  }

  &__divider {
    @apply my-1 border-t border-rule-soft;
  }
}
</style>
