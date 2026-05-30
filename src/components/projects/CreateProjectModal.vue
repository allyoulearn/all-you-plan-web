<template>
  <AppModal
    :model-value="modelValue"
    :title="t('projects.createTitle')"
    :close-on-backdrop="!saving"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <!-- Form fields -->
    <form class="create-project-modal__form" @submit.prevent="handleSubmit">
      <!-- Name field -->
      <AppTextField
        v-model="name"
        :label="t('projects.nameLabel')"
        :placeholder="t('projects.namePlaceholder')"
        :invalid="submitted && !name.trim()"
      />

      <!-- Tag field -->
      <AppTextField
        v-model="tag"
        :label="t('projects.tagLabel')"
        :placeholder="t('projects.tagPlaceholder')"
      />

      <!-- Blurb field -->
      <label class="create-project-modal__field">
        <span class="create-project-modal__label">
          {{ t('projects.blurbLabel') }}
        </span>

        <textarea
          v-model="blurb"
          rows="3"
          maxlength="500"
          :placeholder="t('projects.blurbPlaceholder')"
          class="create-project-modal__textarea"
        />
      </label>
    </form>

    <!-- Actions -->
    <template #footer>
      <AppButton variant="ghost" :disabled="saving" @click="cancel">
        {{ t('common.cancel') }}
      </AppButton>

      <AppButton
        variant="primary"
        :disabled="saving || !name.trim()"
        @click="handleSubmit"
      >
        {{ saving ? t('projects.creating') : t('projects.create') }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script>
/** CreateProjectModal — form to create a new project. */
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProjectsStore } from '@/stores/projects.store.js'
import AppModal from '@/components/ui/AppModal.vue'
import AppTextField from '@/components/ui/AppTextField.vue'
import AppButton from '@/components/ui/AppButton.vue'

export default {
  name: 'CreateProjectModal',
  components: { AppModal, AppTextField, AppButton },
  props: {
    modelValue: { type: Boolean, default: false }
  },
  emits: ['update:modelValue', 'created'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const store = useProjectsStore()

    const name = ref('')
    const tag = ref('')
    const blurb = ref('')
    const submitted = ref(false)
    const saving = ref(false)

    watch(
      () => props.modelValue,
      open => {
        if (open) reset()
      }
    )

    return { t, name, tag, blurb, submitted, saving, cancel, handleSubmit }

    // -- Function definitions --

    /** Reset every form field; called whenever the modal opens. */
    function reset() {
      name.value = ''
      tag.value = ''
      blurb.value = ''
      submitted.value = false
      saving.value = false
    }

    /** Close the modal without saving. */
    function cancel() {
      emit('update:modelValue', false)
    }

    /** Validate, then create the project via the store; closes the modal on success. */
    async function handleSubmit() {
      submitted.value = true
      if (!name.value.trim() || saving.value) return
      saving.value = true

      try {
        const created = await store.createProject({
          name: name.value.trim(),
          tag: tag.value.trim() || undefined,
          blurb: blurb.value.trim() || undefined
        })

        emit('created', created)
        emit('update:modelValue', false)
      } catch {
        // Error already toasted by the store
      } finally {
        saving.value = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.create-project-modal {
  &__form {
    @apply flex flex-col gap-3.5;
  }

  &__field {
    @apply flex flex-col gap-1.5;
  }

  &__label {
    @apply text-[12px] font-medium text-muted;
  }

  &__textarea {
    @apply min-h-[80px] rounded-md border border-rule-soft bg-paper-2 px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-muted focus:border-muted;
  }
}
</style>
