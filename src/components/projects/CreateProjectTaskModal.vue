<template>
  <AppModal
    :model-value="modelValue"
    :title="t('projects.addTask')"
    :close-on-backdrop="!saving"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <!-- Form fields -->
    <form class="create-project-task-modal__form" @submit.prevent="handleSubmit">
      <!-- Title field -->
      <AppTextField
        v-model="title"
        :label="t('tasks.title')"
        :placeholder="t('tasks.titlePlaceholder')"
        :invalid="submitted && !title.trim()"
      />

      <!-- Initial column -->
      <label class="create-project-task-modal__field">
        <span class="create-project-task-modal__label">
          {{ t('projects.columnLabel') }}
        </span>

        <AppSegmentedControl
          v-model="column"
          :options="columnOptions"
          :group-label="t('projects.initialColumnGroupLabel')"
        />
      </label>

      <!-- Tag field -->
      <AppTextField
        v-model="tag"
        :label="t('tasks.tagLabel')"
        :placeholder="t('tasks.tagPlaceholder')"
      />
    </form>

    <!-- Actions -->
    <template #footer>
      <AppButton variant="ghost" :disabled="saving" @click="cancel">
        {{ t('common.cancel') }}
      </AppButton>

      <AppButton
        variant="primary"
        :disabled="saving || !title.trim() || !projectId"
        @click="handleSubmit"
      >
        {{ saving ? t('tasks.creating') : t('tasks.create') }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script>
/** CreateProjectTaskModal — add a new task to a project's board. */
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProjectsStore } from '@/stores/projects.store.js'
import AppModal from '@/components/ui/AppModal.vue'
import AppTextField from '@/components/ui/AppTextField.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSegmentedControl from '@/components/ui/AppSegmentedControl.vue'

export default {
  name: 'CreateProjectTaskModal',
  components: { AppModal, AppTextField, AppButton, AppSegmentedControl },
  props: {
    modelValue: { type: Boolean, default: false },
    /** Required: the project id to create the task under. Must be a non-empty string. */
    projectId: {
      type: String,
      required: true,
      validator: v => typeof v === 'string' && v.length > 0
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const store = useProjectsStore()

    const title = ref('')
    const column = ref('backlog')
    const tag = ref('')
    const submitted = ref(false)
    const saving = ref(false)

    /** Localised options for the initial-column segmented control. */
    const columnOptions = computed(() => [
      { value: 'backlog', label: t('projects.columnBacklog') },
      { value: 'this_week', label: t('projects.columnThisWeek') },
      { value: 'doing', label: t('projects.columnDoing') }
    ])

    watch(
      () => props.modelValue,
      open => {
        if (open) reset()
      }
    )

    return { t, title, column, columnOptions, tag, submitted, saving, cancel, handleSubmit }

    // -- Function definitions --

    /** Reset every form field; called whenever the modal opens. */
    function reset() {
      title.value = ''
      column.value = 'backlog'
      tag.value = ''
      submitted.value = false
      saving.value = false
    }

    /** Close the modal without saving. */
    function cancel() {
      emit('update:modelValue', false)
    }

    /** Validate, then create the project task via the store; closes on success. */
    async function handleSubmit() {
      submitted.value = true
      if (!title.value.trim() || !props.projectId || saving.value) return
      saving.value = true

      try {
        await store.createTask({
          title: title.value.trim(),
          projectId: props.projectId,
          column: column.value,
          tag: tag.value.trim() || undefined
        })

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
.create-project-task-modal {
  &__form {
    @apply flex flex-col gap-3.5;
  }

  &__field {
    @apply flex flex-col gap-1.5;
  }

  &__label {
    @apply text-[12px] font-medium text-muted;
  }
}
</style>
