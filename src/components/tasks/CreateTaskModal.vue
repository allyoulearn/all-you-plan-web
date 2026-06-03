<template>
  <AppModal
    :model-value="modelValue"
    :title="t('tasksWorkspace.newTaskTitle')"
    :close-on-backdrop="!saving"
    initial-focus-selector="input, textarea, select"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <form class="task-create__form" @submit.prevent="handleSubmit">
      <!-- Title -->
      <AppTextField
        v-model="title"
        :label="t('tasks.title')"
        :placeholder="t('tasksWorkspace.titlePlaceholder')"
        :invalid="submitted && !title.trim()"
      />

      <!-- Note -->
      <label class="task-create__field">
        <span class="task-create__label">
          {{ t('tasks.noteLabel') }}
        </span>

        <textarea
          v-model="note"
          class="task-create__textarea"
          rows="2"
          :placeholder="t('tasks.notePlaceholder')"
        />
      </label>

      <!-- Category + Urgency -->
      <div class="task-create__row">
        <label class="task-create__field">
          <span class="task-create__label">
            {{ t('tasksWorkspace.categoryLabel') }}
          </span>

          <select v-model="category" class="task-create__select">
            <option value="">
              {{ t('tasksWorkspace.noCategory') }}
            </option>

            <option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </label>

        <label class="task-create__field">
          <span class="task-create__label">
            {{ t('tasksWorkspace.urgencyLabel') }}
          </span>

          <select v-model="urgency" class="task-create__select">
            <option v-for="opt in urgencyOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </label>
      </div>

      <!-- Kind -->
      <label class="task-create__field">
        <span class="task-create__label">
          {{ t('tasksWorkspace.kindLabel') }}
        </span>

        <select v-model="kind" class="task-create__select" @change="onKindSelect">
          <option v-for="opt in kindOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </label>

      <!-- Due date (optional) -->
      <AppDatePicker
        v-model="dueDate"
        :label="t('tasksWorkspace.dueDateOptional')"
        :placeholder="t('tasksWorkspace.dueDatePlaceholder')"
        clearable
      />

      <!-- Project (optional) -->
      <label class="task-create__field">
        <span class="task-create__label">
          {{ t('tasksWorkspace.projectOptional') }}
        </span>

        <select v-model="projectId" class="task-create__select">
          <option value="">
            {{ t('tasksWorkspace.noProject') }}
          </option>

          <option v-for="p in projects" :key="p.id" :value="p.id">
            {{ p.name }}
          </option>
        </select>
      </label>
    </form>

    <template #footer>
      <AppButton variant="ghost" :disabled="saving" @click="cancel">
        {{ t('common.cancel') }}
      </AppButton>

      <AppButton variant="primary" :disabled="saving || !title.trim()" @click="handleSubmit">
        {{ saving ? t('tasksWorkspace.creating') : t('tasksWorkspace.create') }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script>
/**
 * CreateTaskModal — the workspace's "New task" composer.
 *
 * A functional form over the shared task primitives: title, note, category,
 * urgency, kind, an optional due date (AppDatePicker), and an optional project.
 * Setting a due date nudges the kind to "deadline" unless the user already
 * picked one, mirroring the API's implied-kind rule. Submits via the tasks
 * store and closes on success; errors are toasted by the store.
 */
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTasksStore } from '@/stores/tasks.store.js'
import { useProjectsStore } from '@/stores/projects.store.js'
import { URGENCY_LABELS, CATEGORY_LABELS, URGENCY_ORDER, CATEGORY_ORDER } from '@/stores/tasks.store.js'
import AppModal from '@/components/ui/AppModal.vue'
import AppTextField from '@/components/ui/AppTextField.vue'
import AppDatePicker from '@/components/ui/AppDatePicker.vue'
import AppButton from '@/components/ui/AppButton.vue'

export default {
  name: 'CreateTaskModal',
  components: { AppModal, AppTextField, AppDatePicker, AppButton },
  props: {
    modelValue: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const store = useTasksStore()
    const projectsStore = useProjectsStore()

    const title = ref('')
    const note = ref('')
    const category = ref('')
    const urgency = ref('medium')
    const kind = ref('once')
    const dueDate = ref('')
    const projectId = ref('')
    const submitted = ref(false)
    const saving = ref(false)
    // Tracks whether the user manually chose a kind so the dueDate→deadline
    // auto-nudge doesn't override an explicit choice.
    const kindTouched = ref(false)

    const projects = computed(() => projectsStore.projects ?? [])

    const categoryOptions = computed(() =>
      CATEGORY_ORDER.map(c => ({ value: c, label: CATEGORY_LABELS[c] }))
    )

    const urgencyOptions = computed(() =>
      URGENCY_ORDER.map(u => ({ value: u, label: URGENCY_LABELS[u] }))
    )

    const kindOptions = computed(() => [
      { value: 'once', label: t('tasksWorkspace.kindOnce') },
      { value: 'deadline', label: t('tasksWorkspace.kindDeadline') },
      { value: 'recurring', label: t('tasksWorkspace.kindRecurring') }
    ])

    // Picking a due date implies a deadline unless the user set the kind
    // themselves; clearing it relaxes an auto-set deadline back to a one-off.
    watch(dueDate, val => {
      if (kindTouched.value) return
      kind.value = val ? 'deadline' : 'once'
    })

    watch(
      () => props.modelValue,
      open => {
        if (open) {
          reset()
          ensureProjects()
        }
      }
    )

    onMounted(ensureProjects)

    return {
      t,
      title,
      note,
      category,
      urgency,
      kind,
      dueDate,
      projectId,
      submitted,
      saving,
      projects,
      categoryOptions,
      urgencyOptions,
      kindOptions,
      onKindSelect,
      cancel,
      handleSubmit
    }

    // -- Function definitions --

    /**
     * Lazily load the project list so the dropdown is populated. Cheap no-op
     * when projects are already in the store. `Promise.resolve` guards against
     * an action that returns a non-promise (e.g. a test spy).
     */
    function ensureProjects() {
      if (projectsStore.projects?.length) return
      Promise.resolve(projectsStore.loadProjects()).catch(() => {})
    }

    /** Reset every field to its default; called whenever the modal opens. */
    function reset() {
      title.value = ''
      note.value = ''
      category.value = ''
      urgency.value = 'medium'
      kind.value = 'once'
      dueDate.value = ''
      projectId.value = ''
      submitted.value = false
      saving.value = false
      kindTouched.value = false
    }

    /** Mark the kind as user-chosen so the dueDate auto-nudge backs off. */
    function onKindSelect() {
      kindTouched.value = true
    }

    /** Close without saving. */
    function cancel() {
      emit('update:modelValue', false)
    }

    /** Validate, create via the store, and close on success. */
    async function handleSubmit() {
      submitted.value = true
      if (!title.value.trim() || saving.value) return
      saving.value = true

      try {
        await store.createTask({
          title: title.value.trim(),
          note: note.value.trim() || undefined,
          category: category.value || undefined,
          urgency: urgency.value || undefined,
          kind: kind.value || undefined,
          dueDate: dueDate.value || undefined,
          projectId: projectId.value || undefined
        })

        emit('update:modelValue', false)
      } catch {
        // Error already toasted by the store.
      } finally {
        saving.value = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.task-create {
  &__form {
    @apply flex flex-col gap-3.5;
  }

  &__row {
    @apply grid grid-cols-2 gap-3;
  }

  &__field {
    @apply flex flex-col gap-1.5;
  }

  &__label {
    @apply text-[12px] font-medium text-muted;
  }

  &__textarea {
    @apply min-h-[64px] resize-y rounded-md border border-rule-soft bg-paper-2 px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-muted focus:border-muted;
  }

  &__select {
    @apply rounded-md border border-rule-soft bg-paper-2 px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors focus:border-muted;
  }
}
</style>
