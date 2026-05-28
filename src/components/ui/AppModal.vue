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
            `showClose` is true, even without a title or header slot. Absolute-positioned via the .modal__close--floating
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
            <AppIcon name="x" :size="18" />
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
/** AppModal — centered dialog with backdrop, escape-to-close, focus trap, and
 *  focus restoration to the element that opened the dialog.
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'

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

/**
 * Return all focusable descendants of `container` in document order.
 *
 * @param {HTMLElement | null} container - The element to search within.
 * @returns {HTMLElement[]} Focusable elements (empty array when container is nullish).
 */
function getFocusable(container) {
  if (!container) return []
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(el => {
    return !el.hasAttribute('disabled') && el.tabIndex !== -1
  })
}

// Module-scope counter so nested / stacked modals correctly restore the
// document scroll-lock only after the outermost one closes.
let openModalCount = 0
let savedBodyOverflow = ''
let savedBodyPaddingRight = ''

/**
 * Disable body scroll while a modal is open and compensate for the missing
 * scrollbar so the underlying page does not shift horizontally. Reference
 * counts opens so nested/stacked modals only release the lock once all close.
 */
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

/** Release the body scroll lock acquired by lockBodyScroll, restoring original styles when the last open modal closes. */
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
  name: 'AppModal',
  components: { AppIcon },
  props: {
    /** Open/close state (v-model) */
    modelValue: { type: Boolean, default: false },
    /**
     * Dialog title shown in the header. Used only when the `header` slot is
     * not provided — if a consumer passes both a custom header slot and a
     * `title`, the title prop is silently ignored.
     */
    title: { type: String, default: '' },
    /** Allow closing by clicking the backdrop */
    closeOnBackdrop: { type: Boolean, default: true },
    /**
     * ARIA role. Use `alertdialog` for destructive confirmations so AT
     * announces them immediately rather than as a passive dialog.
     */
    role: {
      type: String,
      default: 'dialog',
      validator: v => ['dialog', 'alertdialog'].includes(v)
    },
    /**
     * Accessible label for the close button. English default; consumers
     * localize per the family no-i18n-in-primitives rule.
     */
    closeLabel: { type: String, default: 'Close dialog' },
    /** Whether to render the close button. */
    showClose: { type: Boolean, default: true },
    /** Id of an element that describes the dialog (used with aria-describedby). */
    ariaDescribedby: { type: String, default: '' },
    /**
     * Optional CSS selector matched against the panel's descendants on open.
     * When provided and a matching focusable element is found, focus moves
     * to that element instead of the panel itself — so form modals can land
     * on the first input rather than requiring an extra Tab.
     */
    initialFocusSelector: { type: String, default: '' }
  },
  emits: ['update:modelValue'],
  setup(props, { emit, slots }) {
    const panelRef = ref(null)
    const titleId = `modal-title-${++modalUid}`
    let previouslyFocused = null

    // ARIA name resolution: never render aria-label="".
    // Prefer aria-labelledby to the visible title; fall back to a literal
    // "Dialog" label only when there is neither a title nor a header slot.

    /** Id of the visible title element when one is rendered; otherwise undefined so the attribute is omitted. */
    const ariaLabelledBy = computed(() => (props.title ? titleId : undefined))

    /** Literal accessible name used only when no title or header slot supplies one. */
    const ariaLabel = computed(() => {
      if (props.title) return undefined
      if (slots.header) return undefined
      return 'Dialog'
    })

    watch(
      () => props.modelValue,
      async (open, wasOpen) => {
        if (open) {
          // Capture the trigger before we move focus into the dialog
          // ( — restore focus to the trigger on close).
          previouslyFocused =
            typeof document !== 'undefined' ? document.activeElement : null

          attachKeyHandler()
          lockBodyScroll()
          await nextTick()
          // prefer the consumer-supplied initial focus target if
          // it resolves to something focusable inside the panel; otherwise
          // fall back to focusing the panel itself (existing behavior).
          let focused = false

          if (props.initialFocusSelector && panelRef.value) {
            const target = panelRef.value.querySelector(props.initialFocusSelector)

            if (target && typeof target.focus === 'function') {
              try {
                target.focus()
                focused = true
              } catch {
                // Element became unfocusable mid-transition — fall through.
              }
            }
          }

          if (!focused) panelRef.value?.focus()
        } else if (wasOpen) {
          detachKeyHandler()
          unlockBodyScroll()
          restoreFocus()
        }
      },
      // Fire on initial mount when modelValue is already true
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

    // -- Function definitions --

    /** Emit the v-model update that closes the dialog. */
    function close() {
      emit('update:modelValue', false)
    }

    /** Close the dialog when the backdrop is clicked, unless `closeOnBackdrop` is false. */
    function handleBackdropClick() {
      if (props.closeOnBackdrop) close()
    }

    /**
     * Document-level key handler bound only while the dialog is open so it
     * catches ESC and Tab even when focus has drifted off the panel.
     * Implements the focus trap: Tab/Shift+Tab cycle focus between the first
     * and last focusable descendants of the panel.
     *
     * @param {KeyboardEvent} e - The keydown event.
     */
    function onKeydown(e) {
      if (!props.modelValue) return

      if (e.key === 'Escape') {
        e.stopPropagation()
        close()
        return
      }

      if (e.key === 'Tab') {
        // Focus trap: cycle focus inside the panel.
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

    /** Bind the document-level keydown handler in capture phase. */
    function attachKeyHandler() {
      document.addEventListener('keydown', onKeydown, true)
    }

    /** Remove the document-level keydown handler. */
    function detachKeyHandler() {
      document.removeEventListener('keydown', onKeydown, true)
    }

    /**
     * Move focus back to the element that opened the dialog. Safely no-ops
     * when the trigger has been removed from the DOM or is no longer
     * focusable.
     */
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
  }
}
</script>

<style lang="scss" scoped>
.modal {
  @apply fixed inset-0 z-50 flex items-center justify-center p-4;

  // Static rgba fallback for browsers without color-mix support (older
  // Safari, embedded WebViews on older OSes) — kept first so the modern
  // declaration cascades on top in supporting browsers.
  background-color: rgba(14, 14, 14, 0.4);
  background-color: color-mix(in oklab, var(--ink) 40%, transparent);

  &__panel {
    // `relative` anchors the absolutely-positioned close button. Uses paper-2
    // (a higher elevation token) rather than paper so the panel reads above
    // the page in dark themes where --paper matches the body background.
    @apply relative w-full max-w-md overflow-hidden rounded-lg bg-paper-2 shadow-md outline-none;
    border: 1px solid var(--rule-soft);
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
      // visually distinct from the body content.
      @apply z-10;
    }
  }

  &__body {
    @apply px-5 py-5;
  }

  &__footer {
    @apply flex justify-end gap-2.5 border-t border-rule-soft bg-paper-3 px-5 py-4;
  }
}

.modal-enter-active,
.modal-leave-active {
  @apply transition-opacity duration-150;

  // Subtle panel lift on enter/leave for a sense of motion.
  .modal__panel {
    @apply transition-all duration-150 ease-out;
  }
}

.modal-enter-from,
.modal-leave-to {
  @apply opacity-0;

  .modal__panel {
    @apply scale-[0.96] opacity-0;
  }
}

// Honor user motion preferences: collapse the transitions to a
// near-instant duration and skip the scale animation entirely.
@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active {
    transition-duration: 0.01ms;

    .modal__panel {
      transition-duration: 0.01ms;
      transform: none;
    }
  }
  .modal-enter-from,
  .modal-leave-to {
    .modal__panel {
      transform: none;
    }
  }
}
</style>
