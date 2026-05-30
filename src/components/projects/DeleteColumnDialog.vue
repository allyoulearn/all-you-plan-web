<template>
  <AppModal
    :model-value="modelValue"
    :title="t('kanban.deleteTitle')"
    role="alertdialog"
    :close-on-backdrop="!saving"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <!-- Body -->
    <div class="delete-column-dialog">
      <!-- Confirmation message -->
      <p v-if="taskCount > 0" class="delete-column-dialog__message">
        {{ t('kanban.deleteWithTasks', taskCount, { named: { count: taskCount } }) }}
      </p>

      <p v-else class="delete-column-dialog__message">
        {{ t('kanban.deleteEmpty') }}
      </p>

      <!-- Mode selection -->
      <fieldset v-if="taskCount > 0" class="delete-column-dialog__modes">
        <!-- Move tasks option -->
        <label class="delete-column-dialog__mode">
          <input
            type="radio"
            name="delete-column-mode"
            value="move"
            :checked="mode === 'move'"
            :disabled="!moveTargets.length"
            @change="mode = 'move'"
          >

          <span>
            {{ t('kanban.deleteModeMove') }}
          </span>
        </label>

        <!-- Target column select -->
        <div v-if="mode === 'move' && moveTargets.length" class="delete-column-dialog__select-row">
          <label class="delete-column-dialog__select-label">
            {{ t('kanban.deleteMoveTo') }}
          </label>

          <select v-model="moveTo" class="delete-column-dialog__select">
            <option v-for="col in moveTargets" :key="col.id" :value="col.id">
              {{ col.label }}
            </option>
          </select>
        </div>

        <!-- Delete tasks option -->
        <label class="delete-column-dialog__mode">
          <input
            type="radio"
            name="delete-column-mode"
            value="delete"
            :checked="mode === 'delete'"
            @change="mode = 'delete'"
          >

          <span>
            {{ t('kanban.deleteModeDelete') }}
          </span>
        </label>
      </fieldset>
    </div>

    <!-- Actions -->
    <template #footer>
      <AppButton variant="ghost" :disabled="saving" @click="cancel">
        {{ t('common.cancel') }}
      </AppButton>

      <AppButton variant="primary" :disabled="saving || !canConfirm" @click="confirm">
        {{ saving ? t('common.loading') : t('kanban.deleteConfirm') }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script>
/**
 * DeleteColumnDialog — confirms deletion of a kanban column, with a
 * radio-driven choice of moving tasks to another column or deleting them
 * too. When the column is empty, mode selection is suppressed and the
 * confirm button just deletes.
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'

export default {
  name: 'DeleteColumnDialog',
  components: { AppModal, AppButton },
  props: {
    modelValue: { type: Boolean, default: false },
    /** The column being deleted (object with at least id + label). */
    column: { type: Object, default: () => null },
    /** Number of tasks currently in the column. */
    taskCount: { type: Number, default: 0 },
    /** Other columns the user can move tasks into. */
    moveTargets: { type: Array, default: () => [] },
    /** While true the action buttons disable (mutation in flight). */
    saving: { type: Boolean, default: false }
  },
  emits: ['update:modelValue', 'confirm'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const mode = ref('move')
    const moveTo = ref('')

    watch(
      () => props.modelValue,
      open => {
        if (!open) return

        if (props.moveTargets.length) {
          mode.value = 'move'
          moveTo.value = props.moveTargets[0]?.id ?? ''
        } else {
          mode.value = 'delete'
          moveTo.value = ''
        }
      }
    )

    /** True when the Confirm button is allowed (a destination column is picked when needed). */
    const canConfirm = computed(() => {
      if (props.taskCount === 0) return true
      if (mode.value === 'move') return Boolean(moveTo.value)
      return true
    })

    return { t, mode, moveTo, canConfirm, cancel, confirm }

    // -- Function definitions --

    /** Close the dialog without firing a deletion. */
    function cancel() {
      emit('update:modelValue', false)
    }

    /** Emit `confirm` with the selected mode + destination column id (if any). */
    function confirm() {
      if (!canConfirm.value || props.saving) return

      if (props.taskCount === 0) {
        emit('confirm', { mode: 'delete', moveToColumnId: null })
        return
      }

      emit('confirm', {
        mode: mode.value,
        moveToColumnId: mode.value === 'move' ? moveTo.value : null
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.delete-column-dialog {
  @apply flex flex-col gap-3;

  &__message {
    @apply text-[14px] leading-relaxed text-ink;
  }

  &__modes {
    @apply flex flex-col gap-2 border-0 p-0;
  }

  &__mode {
    @apply flex items-center gap-2 text-[13px] text-ink;

    input[type='radio'] {
      @apply accent-accent;
    }
  }

  &__select-row {
    @apply ml-6 flex items-center gap-2;
  }

  &__select-label {
    @apply text-[12px] text-muted;
  }

  &__select {
    @apply rounded-md border border-rule-soft bg-paper px-2 py-1 text-[13px] text-ink;
  }
}
</style>
