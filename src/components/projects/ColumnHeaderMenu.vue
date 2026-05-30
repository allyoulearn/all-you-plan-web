<template>
  <div class="column-header-menu" :class="{ 'column-header-menu--open': open }">
    <!-- Trigger button -->
    <button
      ref="triggerRef"
      type="button"
      class="column-header-menu__trigger"
      :aria-label="t('kanban.columnActions')"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click.stop="toggle"
    >
      <AppIcon name="more" :size="16" />
    </button>

    <!-- Dropdown menu -->
    <ul
      v-if="open"
      ref="menuRef"
      class="column-header-menu__list"
      role="menu"
    >
      <!-- Rename action -->
      <li role="none">
        <button
          type="button"
          role="menuitem"
          class="column-header-menu__item"
          @click="emitAction('rename')"
        >
          <AppIcon name="pencil" :size="14" />

          <span>
            {{ t('kanban.rename') }}
          </span>
        </button>
      </li>

      <!-- Delete action -->
      <li role="none">
        <button
          type="button"
          role="menuitem"
          class="column-header-menu__item column-header-menu__item--danger"
          @click="emitAction('delete')"
        >
          <AppIcon name="trash" :size="14" />

          <span>
            {{ t('common.delete') }}
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script>
/**
 * ColumnHeaderMenu — overflow menu for a kanban column header.
 * Emits `rename` and `delete` events. Closes on outside click or Escape.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'

export default {
  name: 'ColumnHeaderMenu',
  components: { AppIcon },
  emits: ['rename', 'delete'],
  setup(_, { emit }) {
    const { t } = useI18n()
    const open = ref(false)
    const triggerRef = ref(null)
    const menuRef = ref(null)

    onMounted(() => {
      document.addEventListener('click', onDocClick)
      document.addEventListener('keydown', onKey)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    })

    return { t, open, triggerRef, menuRef, toggle, emitAction }

    // -- Function definitions --

    /** Flip the dropdown open/closed. */
    function toggle() {
      open.value = !open.value
    }

    /** Force the dropdown closed. */
    function close() {
      open.value = false
    }

    /**
     * Close the menu and re-emit a menu-item action to the parent.
     * @param {'rename'|'delete'} name
     */
    function emitAction(name) {
      close()
      emit(name)
    }

    /** Document click handler: close the menu when clicking outside trigger/list. */
    function onDocClick(e) {
      if (!open.value) return
      const t1 = triggerRef.value
      const t2 = menuRef.value
      if (t1 && t1.contains(e.target)) return
      if (t2 && t2.contains(e.target)) return
      close()
    }

    /** Document keydown handler: close the menu on Escape. */
    function onKey(e) {
      if (e.key === 'Escape' && open.value) {
        e.stopPropagation()
        close()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.column-header-menu {
  @apply relative;

  &__trigger {
    @apply inline-flex h-6 w-6 items-center justify-center rounded-pill text-muted transition-colors hover:bg-paper-3 hover:text-ink;
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;
  }

  &--open &__trigger {
    @apply bg-paper-3 text-ink;
  }

  &__list {
    @apply absolute right-0 top-7 z-20 min-w-[140px] rounded-md border border-rule-soft bg-paper py-1 shadow-md;
  }

  &__item {
    @apply flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-ink transition-colors hover:bg-paper-2;

    &--danger {
      @apply text-bad hover:bg-paper-3;
    }
  }
}
</style>
