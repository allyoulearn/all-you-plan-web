<template>
  <Modal
    :model-value="modelValue"
    :title="t('kanban.renameTitle')"
    :close-on-backdrop="!saving"
    initial-focus-selector="input"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <form class="rename-column-modal__form" @submit.prevent="handleSubmit">
      <TextField
        v-model="label"
        :label="t('kanban.renameLabel')"
        :invalid="submitted && !label.trim()"
      />
    </form>

    <template #footer>
      <Button variant="ghost" :disabled="saving" @click="cancel">
        {{ t('common.cancel') }}
      </Button>

      <Button variant="primary" :disabled="saving || !label.trim()" @click="handleSubmit">
        {{ saving ? t('common.loading') : t('common.save') }}
      </Button>
    </template>
  </Modal>
</template>

<script>
/** RenameColumnModal — single-field modal to rename a kanban column. */
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/ui/Modal.vue'
import TextField from '@/components/ui/TextField.vue'
import Button from '@/components/ui/Button.vue'

export default {
  name: 'RenameColumnModal',
  components: { Modal, TextField, Button },
  props: {
    modelValue: { type: Boolean, default: false },
    /** Current column label; prefilled in the input when the modal opens. */
    initialLabel: { type: String, default: '' },
    /** While true the buttons are disabled (mutation in flight). */
    saving: { type: Boolean, default: false }
  },
  emits: ['update:modelValue', 'submit'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const label = ref(props.initialLabel)
    const submitted = ref(false)

    watch(
      () => props.modelValue,
      open => {
        if (open) {
          label.value = props.initialLabel
          submitted.value = false
        }
      }
    )

    function cancel() {
      emit('update:modelValue', false)
    }

    function handleSubmit() {
      submitted.value = true
      const trimmed = label.value.trim()
      if (!trimmed || props.saving) return
      emit('submit', trimmed)
    }

    return { t, label, submitted, cancel, handleSubmit }
  }
}
</script>

<style lang="scss" scoped>
.rename-column-modal {
  &__form {
    @apply flex flex-col gap-3.5;
  }
}
</style>
