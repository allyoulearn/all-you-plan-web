<template>
  <Modal
    v-model="open"
    :title="title"
    :role="role"
    :close-label="closeLabel"
    :aria-describedby="messageId"
  >
    <div class="confirm-dialog">
      <p :id="messageId" class="confirm-dialog__message">
        {{ message }}
      </p>
    </div>

    <template #footer>
      <Button
        ref="cancelRef"
        variant="ghost"
        :disabled="busy"
        @click="cancel"
      >
        {{ cancelLabel }}
      </Button>

      <Button :variant="variant" :disabled="busy" @click="confirm">
        {{ busy && busyLabel ? busyLabel : confirmLabel }}
      </Button>
    </template>
  </Modal>
</template>

<script>
/**
 * ConfirmDialog — small modal for yes/no style confirmations.
 *
 * Renders as `role="alertdialog"` so screen readers announce it immediately
 * (WEB-W2-08). The message is linked to the dialog via `aria-describedby`
 * (WEB-W2-09). Focus is moved to the cancel (safer) button on open so an
 * accidental Enter dismisses without performing the destructive action
 * (WEB-W2-11).
 *
 * The English defaults on `title`, `confirmLabel`, and `cancelLabel` are
 * intended to be overridden by consumers with i18n-routed strings — they
 * exist only so the primitive remains usable in a no-i18n smoke test or
 * Storybook context (WEB-W2-10).
 */
import { computed, nextTick, ref, watch } from 'vue'
import Modal from './Modal.vue'
import Button from './Button.vue'

// Module-scope counter so multiple ConfirmDialogs do not collide on ids.
let confirmUid = 0

export default {
  name: 'ConfirmDialog',
  components: { Modal, Button },
  props: {
    /** Open/close state (v-model). */
    modelValue: { type: Boolean, default: false },
    /** Visible title shown in the dialog header. English default; localize at the consumer. */
    title: { type: String, default: 'Confirm' },
    /** The yes/no question or descriptive message. */
    message: { type: String, default: '' },
    /** Primary action button label. */
    confirmLabel: { type: String, default: 'Confirm' },
    /** Cancel button label (also restored on Escape / backdrop close). */
    cancelLabel: { type: String, default: 'Cancel' },
    /** Optional in-flight label that replaces `confirmLabel` while `busy` is true. */
    busyLabel: { type: String, default: '' },
    /** When true, both buttons are disabled (mutation in flight). */
    busy: { type: Boolean, default: false },
    /** Variant applied to the confirm button. */
    variant: {
      type: String,
      default: 'primary',
      validator: v => ['default', 'primary', 'accent', 'ghost'].includes(v)
    },
    /** ARIA role passed through to Modal. `alertdialog` is the default for confirmations. */
    role: {
      type: String,
      default: 'alertdialog',
      validator: v => ['dialog', 'alertdialog'].includes(v)
    },
    /** Accessible label for the close (X) button — forwarded to Modal. */
    closeLabel: { type: String, default: 'Close dialog' }
  },
  emits: ['update:modelValue', 'confirm', 'cancel'],
  setup(props, { emit }) {
    const cancelRef = ref(null)
    const messageId = `confirm-dialog-message-${++confirmUid}`

    // Computed proxy so we can `v-model="open"` on the inner Modal without
    // the brittle manual `@update:model-value` forward (WEB-W2-13).
    const open = computed({
      get: () => props.modelValue,
      set: v => emit('update:modelValue', v)
    })

    function confirm() {
      emit('confirm')
    }

    function cancel() {
      emit('cancel')
      emit('update:modelValue', false)
    }

    // Move focus to Cancel (the safer choice) once the dialog opens.
    // Two `nextTick`s defer past Modal's own focus(panel) on the same tick.
    watch(
      () => props.modelValue,
      async opened => {
        if (!opened) return
        await nextTick()
        await nextTick()
        // The Button component exposes the underlying <button> via $el.
        const el = cancelRef.value?.$el ?? cancelRef.value
        if (el && typeof el.focus === 'function') el.focus()
      }
    )

    return { confirm, cancel, cancelRef, messageId, open }
  }
}
</script>

<style lang="scss" scoped>
.confirm-dialog {
  // BEM-anchored wrapper so future confirm-dialog__* modifiers land under a
  // real root element (WEB-W2-40).
  &__message {
    @apply text-[14px] leading-relaxed text-ink;
  }
}
</style>
