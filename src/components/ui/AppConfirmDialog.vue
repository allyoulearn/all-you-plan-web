<template>
  <AppModal
    v-model="open"
    :title="title"
    :role="role"
    :close-label="closeLabel"
    :aria-describedby="messageId"
  >
    <!-- Message body -->
    <div class="confirm-dialog">
      <p :id="messageId" class="confirm-dialog__message">
        {{ message }}
      </p>
    </div>

    <!-- Action buttons -->
    <template #footer>
      <!-- Cancel (initial focus) -->
      <AppButton
        ref="cancelRef"
        variant="ghost"
        :disabled="busy"
        @click="cancel"
      >
        {{ cancelLabel }}
      </AppButton>

      <!-- Confirm -->
      <AppButton :variant="variant" :disabled="busy" @click="confirm">
        {{ busy && busyLabel ? busyLabel : confirmLabel }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script>
/**
 * AppConfirmDialog — small modal for yes/no style confirmations.
 *
 * Renders as `role="alertdialog"` so screen readers announce it immediately
 *. The message is linked to the dialog via `aria-describedby`
 *. Focus is moved to the cancel (safer) button on open so an
 * accidental Enter dismisses without performing the destructive action
 *.
 *
 * The English defaults on `title`, `confirmLabel`, and `cancelLabel` are
 * intended to be overridden by consumers with i18n-routed strings — they
 * exist only so the primitive remains usable in a no-i18n smoke test or
 * Storybook context.
 */
import { computed, nextTick, ref, watch } from 'vue'
import AppModal from './AppModal.vue'
import AppButton from './AppButton.vue'

// Module-scope counter so multiple ConfirmDialogs do not collide on ids.
let confirmUid = 0

export default {
  name: 'AppConfirmDialog',
  components: { AppModal, AppButton },
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
    /** ARIA role passed through to AppModal. `alertdialog` is the default for confirmations. */
    role: {
      type: String,
      default: 'alertdialog',
      validator: v => ['dialog', 'alertdialog'].includes(v)
    },
    /** Accessible label for the close (X) button — forwarded to AppModal. */
    closeLabel: { type: String, default: 'Close dialog' }
  },
  emits: ['update:modelValue', 'confirm', 'cancel'],
  setup(props, { emit }) {
    const cancelRef = ref(null)
    const messageId = `confirm-dialog-message-${++confirmUid}`

    /**
     * Writable computed proxy bridging the outer `modelValue` prop and the
     * inner AppModal's v-model. Lets us `v-model="open"` on AppModal without
     * the brittle manual `@update:model-value` forward.
     */
    const open = computed({
      get: () => props.modelValue,
      set: v => emit('update:modelValue', v)
    })

    // Move focus to Cancel (the safer choice) once the dialog opens.
    // Two `nextTick`s defer past AppModal's own focus(panel) on the same tick.
    watch(
      () => props.modelValue,
      async opened => {
        if (!opened) return
        await nextTick()
        await nextTick()
        // The AppButton component exposes the underlying <button> via $el.
        const el = cancelRef.value?.$el ?? cancelRef.value
        if (el && typeof el.focus === 'function') el.focus()
      }
    )

    return { confirm, cancel, cancelRef, messageId, open }

    // -- Function definitions --

    /** Emit the `confirm` event; consumers decide whether to close the dialog after the action resolves. */
    function confirm() {
      emit('confirm')
    }

    /** Emit `cancel` and close the dialog. */
    function cancel() {
      emit('cancel')
      emit('update:modelValue', false)
    }
  }
}
</script>

<style lang="scss" scoped>
.confirm-dialog {
  // BEM-anchored wrapper so future confirm-dialog__* modifiers land under a
  // real root element.
  &__message {
    @apply text-[14px] leading-relaxed text-ink;
  }
}
</style>
