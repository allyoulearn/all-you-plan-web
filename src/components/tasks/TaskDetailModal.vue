<template>
  <Modal
    :model-value="modelValue"
    :title="t('tasks.detailTitle')"
    :close-on-backdrop="!busy"
    initial-focus-selector="input[name='title']"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <form v-if="task" class="task-detail-modal__form" @submit.prevent="handleSubmit">
      <TextField
        v-model="form.title"
        name="title"
        :label="t('tasks.title')"
        :invalid="submitted && !form.title.trim()"
      />

      <label class="task-detail-modal__label">
        {{ t('tasks.noteLabel') }}

        <textarea
          v-model="form.note"
          class="task-detail-modal__textarea"
          rows="3"
          :placeholder="t('tasks.notePlaceholder')"
        />
      </label>

      <div class="task-detail-modal__row">
        <TextField
          v-model="form.scheduledDate"
          type="date"
          :label="t('tasks.dateLabel')"
        />

        <TextField
          v-model="form.scheduledTime"
          type="time"
          :label="t('tasks.timeLabel')"
        />
      </div>

      <div class="task-detail-modal__row">
        <TextField
          v-model="form.tag"
          :label="t('tasks.tagLabel')"
          :placeholder="t('tasks.tagPlaceholder')"
        />

        <TextField
          v-model="form.effortMinutes"
          type="number"
          :label="t('tasks.effort')"
          :placeholder="t('tasks.effortPlaceholder')"
          min="1"
          step="1"
        />
      </div>

      <div v-if="columns.length" class="task-detail-modal__row">
        <label class="task-detail-modal__label">
          {{ t('tasks.columnLabel') }}

          <select v-model="form.columnId" class="task-detail-modal__select">
            <option v-for="col in columns" :key="col.id" :value="col.id">
              {{ col.label }}
            </option>
          </select>
        </label>
      </div>

      <div class="task-detail-modal__priority">
        <span class="task-detail-modal__priority-label">
          {{ t('tasks.priorityLabel') }}
        </span>

        <SegmentedControl
          v-model="form.priority"
          :group-label="t('tasks.priorityLabel')"
          :options="priorityOptions"
        />
      </div>

      <fieldset class="task-detail-modal__subtasks">
        <legend class="task-detail-modal__subtasks-legend">
          {{ t('tasks.subtasksLabel') }}

          <span v-if="task.subtasks?.length" class="task-detail-modal__subtasks-count">
            {{ subtaskProgress }}
          </span>
        </legend>

        <ul v-if="task.subtasks?.length" class="task-detail-modal__subtask-list">
          <li
            v-for="st in task.subtasks"
            :key="st.id"
            class="task-detail-modal__subtask"
          >
            <input
              type="checkbox"
              :checked="st.done"
              class="task-detail-modal__subtask-check"
              @change="$emit('update-subtask', { subtaskId: st.id, done: !st.done })"
            >

            <input
              :value="st.text"
              type="text"
              class="task-detail-modal__subtask-text"
              :class="{ 'task-detail-modal__subtask-text--done': st.done }"
              @blur="onSubtaskTextBlur(st, $event)"
              @keydown.enter.prevent="$event.target.blur()"
            >

            <button
              type="button"
              class="task-detail-modal__subtask-delete"
              :aria-label="t('common.delete')"
              @click="$emit('delete-subtask', { subtaskId: st.id })"
            >
              <Icon name="trash" :size="14" />
            </button>
          </li>
        </ul>

        <form class="task-detail-modal__subtask-add" @submit.prevent="commitNewSubtask">
          <input
            v-model="newSubtaskText"
            type="text"
            class="task-detail-modal__subtask-input"
            :placeholder="t('tasks.subtaskPlaceholder')"
          >

          <button
            type="submit"
            class="task-detail-modal__subtask-add-button"
            :disabled="!newSubtaskText.trim()"
          >
            <Icon name="plus" :size="14" />

            <span>
              {{ t('common.add') }}
            </span>
          </button>
        </form>
      </fieldset>
    </form>

    <template #footer>
      <Button variant="ghost" :disabled="busy" @click="$emit('delete-task')">
        {{ t('common.delete') }}
      </Button>

      <Button variant="ghost" :disabled="busy" @click="cancel">
        {{ t('common.cancel') }}
      </Button>

      <Button
        variant="primary"
        :disabled="busy || !form.title.trim()"
        @click="handleSubmit"
      >
        {{ busy ? t('common.loading') : t('common.save') }}
      </Button>
    </template>
  </Modal>
</template>

<script>
/**
 * TaskDetailModal — view + edit modal for a single task. Renders every
 * editable field (title, note, schedule, tag, effort, column, priority,
 * subtasks) and emits coarse events the parent translates into the
 * appropriate store action. Kept transport-agnostic so today / projects /
 * future task surfaces can all mount it.
 */
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/ui/Modal.vue'
import TextField from '@/components/ui/TextField.vue'
import Button from '@/components/ui/Button.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import Icon from '@/components/ui/Icon.vue'

function emptyForm() {
  return {
    title: '',
    note: '',
    scheduledDate: '',
    scheduledTime: '',
    tag: '',
    effortMinutes: '',
    columnId: '',
    priority: 'normal'
  }
}

function toForm(task) {
  if (!task) return emptyForm()
  return {
    title: task.title ?? '',
    note: task.note ?? '',
    scheduledDate: task.scheduledDate ? task.scheduledDate.slice(0, 10) : '',
    scheduledTime: task.scheduledTime ?? '',
    tag: task.tag ?? '',
    effortMinutes: task.effortMinutes != null ? String(task.effortMinutes) : '',
    columnId: task.columnId ?? '',
    priority: task.priority ?? 'normal'
  }
}

/** Diff a form against the original task. Returns only the fields that
 *  changed so the parent's mutation payload stays minimal. */
function diffForm(form, task) {
  const updates = {}
  if (!task) return updates
  const normalize = v => (v === '' || v == null ? null : v)
  if (form.title.trim() !== task.title) updates.title = form.title.trim()
  if (normalize(form.note) !== normalize(task.note)) {
    updates.note = form.note.trim() || null
  }
  if (normalize(form.tag) !== normalize(task.tag)) {
    updates.tag = form.tag.trim() || null
  }
  const formDate = form.scheduledDate || null
  const taskDate = task.scheduledDate ? task.scheduledDate.slice(0, 10) : null
  if (formDate !== taskDate) updates.scheduledDate = formDate
  const formTime = form.scheduledTime || null
  const taskTime = task.scheduledTime ?? null
  if (formTime !== taskTime) updates.scheduledTime = formTime
  const formEffort =
    form.effortMinutes === '' ? null : Number(form.effortMinutes)
  const taskEffort = task.effortMinutes ?? null
  if (formEffort !== taskEffort) updates.effortMinutes = formEffort
  if (form.columnId && form.columnId !== task.columnId) {
    updates.columnId = form.columnId
  }
  if (form.priority !== (task.priority ?? 'normal')) {
    updates.priority = form.priority
  }
  return updates
}

export default {
  name: 'TaskDetailModal',
  components: { Modal, TextField, Button, SegmentedControl, Icon },
  props: {
    modelValue: { type: Boolean, default: false },
    /** The task being edited; pass null to render an empty body. */
    task: { type: Object, default: null },
    /** Columns from the active board, for the column select. */
    columns: { type: Array, default: () => [] },
    /** Disable buttons while a save/delete mutation is in flight. */
    busy: { type: Boolean, default: false }
  },
  emits: [
    'update:modelValue',
    'save',
    'delete-task',
    'add-subtask',
    'update-subtask',
    'delete-subtask'
  ],
  setup(props, { emit }) {
    const { t } = useI18n()
    const form = reactive(emptyForm())
    const submitted = ref(false)
    const newSubtaskText = ref('')

    // Re-seed the form whenever the modal opens or the task changes.
    watch(
      () => [props.modelValue, props.task],
      ([open, task]) => {
        if (open) {
          Object.assign(form, toForm(task))
          submitted.value = false
          newSubtaskText.value = ''
        }
      },
      { immediate: true }
    )

    const priorityOptions = computed(() => [
      { value: 'urgent', label: t('tasks.priorityUrgent') },
      { value: 'high', label: t('tasks.priorityHigh') },
      { value: 'normal', label: t('tasks.priorityNormal') },
      { value: 'low', label: t('tasks.priorityLow') }
    ])

    const subtaskProgress = computed(() => {
      const list = props.task?.subtasks ?? []
      const done = list.filter(s => s.done).length
      return `${done}/${list.length}`
    })

    function cancel() {
      emit('update:modelValue', false)
    }

    function handleSubmit() {
      submitted.value = true
      if (!form.title.trim() || props.busy) return
      const updates = diffForm(form, props.task)
      emit('save', updates)
    }

    function commitNewSubtask() {
      const text = newSubtaskText.value.trim()
      if (!text) return
      emit('add-subtask', { text })
      newSubtaskText.value = ''
    }

    function onSubtaskTextBlur(subtask, e) {
      const next = e.target.value.trim()
      if (next && next !== subtask.text) {
        emit('update-subtask', { subtaskId: subtask.id, text: next })
      } else {
        // Restore the visual text if the edit was emptied or unchanged.
        e.target.value = subtask.text
      }
    }

    return {
      t,
      form,
      submitted,
      newSubtaskText,
      priorityOptions,
      subtaskProgress,
      cancel,
      handleSubmit,
      commitNewSubtask,
      onSubtaskTextBlur
    }
  }
}
</script>

<style lang="scss" scoped>
.task-detail-modal {
  &__form {
    @apply flex flex-col gap-3.5;
  }

  &__label {
    @apply flex flex-1 flex-col gap-1.5 text-[12px] font-medium text-muted;
  }

  &__textarea {
    @apply rounded-md border border-rule-soft bg-paper px-2.5 py-2 text-[13px] text-ink placeholder:text-muted;
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;
  }

  &__row {
    @apply flex gap-3;
  }

  &__select {
    @apply rounded-md border border-rule-soft bg-paper px-2 py-2 text-[13px] text-ink;
  }

  &__priority {
    @apply flex items-center justify-between gap-3;
  }

  &__priority-label {
    @apply text-[12px] font-medium text-muted;
  }

  &__subtasks {
    @apply flex flex-col gap-2 rounded-md border border-rule-soft p-3;
  }

  &__subtasks-legend {
    @apply mb-1 flex items-center gap-2 px-1 text-[12px] font-medium text-muted;
  }

  &__subtasks-count {
    @apply font-mono text-[11px] text-muted;
  }

  &__subtask-list {
    @apply flex flex-col gap-1.5;
  }

  &__subtask {
    @apply flex items-center gap-2;
  }

  &__subtask-check {
    @apply accent-accent;
  }

  &__subtask-text {
    @apply min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-[13px] text-ink;

    &:focus {
      @apply border-rule-soft bg-paper outline-none;
    }

    &--done {
      @apply text-muted line-through;
    }
  }

  &__subtask-delete {
    @apply inline-flex h-6 w-6 items-center justify-center rounded-pill text-muted hover:bg-paper-2 hover:text-ink;
  }

  &__subtask-add {
    @apply flex items-center gap-2;
  }

  &__subtask-input {
    @apply min-w-0 flex-1 rounded-md border border-rule-soft bg-paper px-2 py-1 text-[13px] text-ink placeholder:text-muted;
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;
  }

  &__subtask-add-button {
    @apply inline-flex items-center gap-1 rounded-pill border border-rule-soft px-2.5 py-1 text-[12px] text-ink hover:bg-paper-2 disabled:opacity-50;
  }
}
</style>
