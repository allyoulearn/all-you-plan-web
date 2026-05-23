<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="modal"
        :role="role"
        aria-modal="true"
        :aria-label="ariaLabel"
        :aria-labelledby="ariaLabelledBy"
        :aria-describedby="ariaDescribedby || undefined"
        @click.self="handleBackdropClick"
      >
        <div ref="panelRef" class="modal__panel" tabindex="-1">
          <header v-if="title || $slots.header" class="modal__header">
            <slot name="header">
              <h2 :id="titleId" class="modal__title">
                {{ title }}
              </h2>
            </slot>
          </header>

          <!--
            Close button lives outside the header so it always renders when
            `showClose` is true, even without a title or header slot
            (WEB-W2-06). Absolute-positioned via the .modal__close--floating
            modifier when no header backdrop is rendered.
          -->
          <button
            v-if="showClose"
            type="button"
            class="modal__close"
            :class="{ 'modal__close--floating': !(title || $slots.header) }"
            :aria-label="closeLabel"
            @click="close"
          >
            <Icon name="x" :size="18" />
          </button>

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

// Module-scope counter so nested / stacked modals correctly restore the
// document scroll-lock only after the outermost one closes (WEB-W2-03).
let openModalCount = 0
let savedBodyOverflow = ''
let savedBodyPaddingRight = ''

function lockBodyScroll() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  openModalCount += 1
  if (openModalCount > 1) return
  const body = document.body
  if (!body) return
  savedBodyOverflow = body.style.overflow
  savedBodyPaddingRight = body.style.paddingRight
  // Compensate for the disappearing scrollbar so the page does not shift.
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${scrollbarWidth}px`
  }
  body.style.overflow = 'hidden'
}

function unlockBodyScroll() {
  if (typeof document === 'undefined') return
  if (openModalCount === 0) return
  openModalCount -= 1
  if (openModalCount > 0) return
  const body = document.body
  if (!body) return
  body.style.overflow = savedBodyOverflow
  body.style.paddingRight = savedBodyPaddingRight
  savedBodyOverflow = ''
  savedBodyPaddingRight = ''
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
    closeOnBackdrop: { type: Boolean, default: true },
    /**
     * ARIA role. Use `alertdialog` for destructive confirmations so AT
     * announces them immediately rather than as a passive dialog (WEB-W2-08).
     */
    role: {
      type: String,
      default: 'dialog',
      validator: v => ['dialog', 'alertdialog'].includes(v)
    },
    /**
     * Accessible label for the close button. English default; consumers
     * localize per the family no-i18n-in-primitives rule (WEB-W2-05).
     */
    closeLabel: { type: String, default: 'Close dialog' },
    /** Whether to render the close button (WEB-W2-06). */
    showClose: { type: Boolean, default: true },
    /** Id of an element that describes the dialog (used with aria-describedby). */
    ariaDescribedby: { type: String, default: '' }
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
    // catch ESC and Tab even when focus has drifted off the panel (WEB-W2-07).
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
          lockBodyScroll()
          await nextTick()
          panelRef.value?.focus()
        } else if (wasOpen) {
          detachKeyHandler()
          unlockBodyScroll()
          restoreFocus()
        }
      },
      // Fire on initial mount when modelValue is already true (WEB-W2-03)
      // so the scroll lock and key handler attach without a state change.
      { immediate: true }
    )

    onBeforeUnmount(() => {
      detachKeyHandler()
      // If the dialog is unmounted while open, release the scroll lock and
      // still return focus to where it came from.
      if (props.modelValue) unlockBodyScroll()
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
    // `relative` anchors the absolutely-positioned close button (WEB-W2-06).
    @apply relative w-full max-w-md rounded-lg bg-paper shadow-md outline-none;
  }

  &__header {
    // Right-padded enough to clear the absolutely-positioned close button.
    @apply flex items-center justify-between gap-3 border-b border-rule-soft px-5 py-4 pr-12;
  }

  &__title {
    @apply font-serif text-[20px] font-normal text-ink;
  }

  &__close {
    @apply absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-pill text-muted transition-colors hover:bg-paper-2 hover:text-ink;
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;

    &--floating {
      // Modifier reserved for the no-header layout so the button stays
      // visually distinct from the body content (WEB-W2-06).
      @apply z-10;
    }
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
