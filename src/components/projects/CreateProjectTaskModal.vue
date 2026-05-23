<template>
  <Modal
    :model-value="modelValue"
    :title="t('projects.addTask')"
    :close-on-backdrop="!saving"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <form class="create-project-task-modal__form" @submit.prevent="handleSubmit">
      <TextField
        v-model="title"
        :label="t('tasks.title')"
        :placeholder="t('tasks.titlePlaceholder')"
        :invalid="submitted && !title.trim()"
      />

      <label class="create-project-task-modal__field">
        <span class="create-project-task-modal__label">
          {{ t('projects.columnLabel') }}
        </span>

        <SegmentedControl
          v-model="column"
          :options="columnOptions"
          :group-label="t('projects.initialColumnGroupLabel')"
        />
      </label>

      <TextField
        v-model="tag"
        :label="t('tasks.tagLabel')"
        :placeholder="t('tasks.tagPlaceholder')"
      />
    </form>

    <template #footer>
      <Button variant="ghost" :disabled="saving" @click="cancel">
        {{ t('common.cancel') }}
      </Button>

      <Button
        variant="primary"
        :disabled="saving || !title.trim() || !projectId"
        @click="handleSubmit"
      >
        {{ saving ? t('tasks.creating') : t('tasks.create') }}
      </Button>
    </template>
  </Modal>
</template>

<script>
/** CreateProjectTaskModal — add a new task to a project's board. */
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProjectsStore } from '@/stores/projects.store.js'
import Modal from '@/components/ui/Modal.vue'
import TextField from '@/components/ui/TextField.vue'
import Button from '@/components/ui/Button.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'

export default {
  name: 'CreateProjectTaskModal',
  components: { Modal, TextField, Button, SegmentedControl },
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

    const columnOptions = computed(() => [
      { value: 'backlog', label: t('projects.columnBacklog') },
      { value: 'this_week', label: t('projects.columnThisWeek') },
      { value: 'doing', label: t('projects.columnDoing') }
    ])

    function reset() {
      title.value = ''
      column.value = 'backlog'
      tag.value = ''
      submitted.value = false
      saving.value = false
    }

    watch(
      () => props.modelValue,
      open => {
        if (open) reset()
      }
    )

    function cancel() {
      emit('update:modelValue', false)
    }

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

    return { t, title, column, columnOptions, tag, submitted, saving, cancel, handleSubmit }
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
