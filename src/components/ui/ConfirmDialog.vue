<template>
  <Modal
    :model-value="modelValue"
    :title="title"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <p class="confirm-dialog__message">
      {{ message }}
    </p>

    <template #footer>
      <Button variant="ghost" :disabled="busy" @click="cancel">
        {{ cancelLabel }}
      </Button>

      <Button :variant="variant" :disabled="busy" @click="confirm">
        {{ busy && busyLabel ? busyLabel : confirmLabel }}
      </Button>
    </template>
  </Modal>
</template>

<script>
/** ConfirmDialog — small modal for yes/no style confirmations. */
import Modal from './Modal.vue'
import Button from './Button.vue'

export default {
  name: 'ConfirmDialog',
  components: { Modal, Button },
  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: 'Confirm' },
    message: { type: String, default: '' },
    confirmLabel: { type: String, default: 'Confirm' },
    cancelLabel: { type: String, default: 'Cancel' },
    busyLabel: { type: String, default: '' },
    busy: { type: Boolean, default: false },
    variant: {
      type: String,
      default: 'primary',
      validator: v => ['default', 'primary', 'accent', 'ghost'].includes(v)
    }
  },
  emits: ['update:modelValue', 'confirm', 'cancel'],
  setup(_props, { emit }) {
    function confirm() {
      emit('confirm')
    }

    function cancel() {
      emit('cancel')
      emit('update:modelValue', false)
    }

    return { confirm, cancel }
  }
}
</script>

<style lang="scss" scoped>
.confirm-dialog {
  &__message {
    @apply text-[14px] leading-relaxed text-ink;
  }
}
</style>
