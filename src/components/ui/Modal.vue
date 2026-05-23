<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="modal"
        role="dialog"
        aria-modal="true"
        :aria-label="ariaLabel"
        :aria-labelledby="ariaLabelledBy"
        @click.self="handleBackdropClick"
      >
        <div ref="panelRef" class="modal__panel" tabindex="-1">
          <header v-if="title || $slots.header" class="modal__header">
            <slot name="header">
              <h2 :id="titleId" class="modal__title">
                {{ title }}
              </h2>
            </slot>

            <button
              type="button"
              class="modal__close"
              aria-label="Close dialog"
              @click="close"
            >
              <Icon name="x" :size="18" />
            </button>
          </header>

          <div class="modal__body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="modal__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
/** Modal — centered dialog with backdrop, escape-to-close, focus trap, and
 *  focus restoration to the element that opened the dialog.
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import Icon from './Icon.vue'

// Module-scope counter for unique dialog title ids so multiple modal instances
// don't collide on aria-labelledby references.
let modalUid = 0

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

function getFocusable(container) {
  if (!container) return []
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(el => {
    return !el.hasAttribute('disabled') && el.tabIndex !== -1
  })
}

export default {
  name: 'Modal',
  components: { Icon },
  props: {
    /** Open/close state (v-model) */
    modelValue: { type: Boolean, default: false },
    /** Dialog title shown in the header (used only when the `header` slot is not provided) */
    title: { type: String, default: '' },
    /** Allow closing by clicking the backdrop */
    closeOnBackdrop: { type: Boolean, default: true }
  },
  emits: ['update:modelValue'],
  setup(props, { emit, slots }) {
    const panelRef = ref(null)
    const titleId = `modal-title-${++modalUid}`
    let previouslyFocused = null

    // ARIA name resolution (WEB-W2-04): never render aria-label="".
    // Prefer aria-labelledby to the visible title; fall back to a literal
    // "Dialog" label only when there is neither a title nor a header slot.
    const ariaLabelledBy = computed(() => (props.title ? titleId : undefined))
    const ariaLabel = computed(() => {
      if (props.title) return undefined
      if (slots.header) return undefined
      return 'Dialog'
    })

    function close() {
      emit('update:modelValue', false)
    }

    function handleBackdropClick() {
      if (props.closeOnBackdrop) close()
    }

    // Document-level key handler. Bound only while the dialog is open so we
    // catch ESC and Tab even when focus has drifted off the panel.
    function onKeydown(e) {
      if (!props.modelValue) return
      if (e.key === 'Escape') {
        e.stopPropagation()
        close()
        return
      }
      if (e.key === 'Tab') {
        // Focus trap (WEB-W2-01): cycle focus inside the panel.
        const focusables = getFocusable(panelRef.value)
        if (focusables.length === 0) {
          // No focusable descendants — keep focus on the panel itself.
          e.preventDefault()
          panelRef.value?.focus()
          return
        }
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        const active = document.activeElement
        const panelHasFocus = panelRef.value && panelRef.value.contains(active)
        if (e.shiftKey) {
          if (!panelHasFocus || active === first || active === panelRef.value) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (!panelHasFocus || active === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    function attachKeyHandler() {
      document.addEventListener('keydown', onKeydown, true)
    }

    function detachKeyHandler() {
      document.removeEventListener('keydown', onKeydown, true)
    }

    function restoreFocus() {
      const target = previouslyFocused
      previouslyFocused = null
      if (target && typeof target.focus === 'function' && document.contains(target)) {
        try {
          target.focus()
        } catch {
          // Element became unfocusable; nothing else to do.
        }
      }
    }

    watch(
      () => props.modelValue,
      async (open, wasOpen) => {
        if (open) {
          // Capture the trigger before we move focus into the dialog
          // (WEB-W2-02 — restore focus to the trigger on close).
          previouslyFocused =
            typeof document !== 'undefined' ? document.activeElement : null
          attachKeyHandler()
          await nextTick()
          panelRef.value?.focus()
        } else if (wasOpen) {
          detachKeyHandler()
          restoreFocus()
        }
      }
    )

    onBeforeUnmount(() => {
      detachKeyHandler()
      // If the dialog is unmounted while open, still return focus to where it came from.
      restoreFocus()
    })

    return {
      panelRef,
      titleId,
      ariaLabel,
      ariaLabelledBy,
      close,
      handleBackdropClick
    }
  }
}
</script>

<style lang="scss" scoped>
.modal {
  @apply fixed inset-0 z-50 flex items-center justify-center p-4;

  background-color: color-mix(in oklab, var(--ink) 40%, transparent);

  &__panel {
    @apply w-full max-w-md rounded-lg bg-paper shadow-md outline-none;
  }

  &__header {
    @apply flex items-center justify-between gap-3 border-b border-rule-soft px-5 py-4;
  }

  &__title {
    @apply font-serif text-[20px] font-normal text-ink;
  }

  &__close {
    @apply inline-flex h-8 w-8 items-center justify-center rounded-pill text-muted transition-colors hover:bg-paper-2 hover:text-ink;
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;
  }

  &__body {
    @apply px-5 py-5;
  }

  &__footer {
    @apply flex justify-end gap-2.5 border-t border-rule-soft bg-paper-2 px-5 py-4;
  }
}

.modal-enter-active,
.modal-leave-active {
  @apply transition-opacity duration-150;
}

.modal-enter-from,
.modal-leave-to {
  @apply opacity-0;
}
</style>
