<template>
  <AppModal
    :model-value="modelValue"
    :title="t('kanban.renameTitle')"
    :close-on-backdrop="!saving"
    initial-focus-selector="input"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <!-- Form fields -->
    <form class="rename-column-modal__form" @submit.prevent="handleSubmit">
      <!-- Label field -->
      <AppTextField
        v-model="label"
        :label="t('kanban.renameLabel')"
        :invalid="submitted && !label.trim()"
      />
    </form>

    <!-- Actions -->
    <template #footer>
      <AppButton variant="ghost" :disabled="saving" @click="cancel">
        {{ t('common.cancel') }}
      </AppButton>

      <AppButton variant="primary" :disabled="saving || !label.trim()" @click="handleSubmit">
        {{ saving ? t('common.loading') : t('common.save') }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script>
/** RenameColumnModal — single-field modal to rename a kanban column. */
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/ui/AppModal.vue'
import AppTextField from '@/components/ui/AppTextField.vue'
import AppButton from '@/components/ui/AppButton.vue'

export default {
  name: 'RenameColumnModal',
  components: { AppModal, AppTextField, AppButton },
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

    return { t, label, submitted, cancel, handleSubmit }

    // -- Function definitions --

    /** Close the modal without firing a rename. */
    function cancel() {
      emit('update:modelValue', false)
    }

    /** Validate the input and emit `submit` with the trimmed label. */
    function handleSubmit() {
      submitted.value = true
      const trimmed = label.value.trim()
      if (!trimmed || props.saving) return
      emit('submit', trimmed)
    }
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
