<template>
  <div class="add-column-button">
    <!-- Trigger chip -->
    <button
      v-if="!editing"
      type="button"
      class="add-column-button__trigger"
      @click="startEditing"
    >
      <AppIcon name="plus" :size="14" />

      <span>
        {{ t('kanban.addColumn') }}
      </span>
    </button>

    <!-- Inline input -->
    <form v-else class="add-column-button__form" @submit.prevent="commit">
      <input
        ref="inputRef"
        v-model="label"
        type="text"
        class="add-column-button__input"
        :placeholder="t('kanban.newColumnPlaceholder')"
        :disabled="saving"
        @keydown.esc.prevent="cancel"
        @blur="onBlur"
      >
    </form>
  </div>
</template>

<script>
/**
 * AddColumnButton — inline column creator. Renders as a small chip; click
 * swaps it to a text input that commits on Enter and cancels on Escape
 * or blur-without-content. Keeps the kanban add affordance tight to the
 * right edge of the board.
 */
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'

export default {
  name: 'AddColumnButton',
  components: { AppIcon },
  props: {
    /** Disable the input while a creation mutation is in flight. */
    saving: { type: Boolean, default: false }
  },
  emits: ['create'],
  setup(_, { emit }) {
    const { t } = useI18n()
    const editing = ref(false)
    const label = ref('')
    const inputRef = ref(null)

    return { t, editing, label, inputRef, startEditing, cancel, commit, onBlur }

    // -- Function definitions --

    /** Swap the chip for the inline input and focus it. */
    async function startEditing() {
      editing.value = true
      label.value = ''
      await nextTick()
      inputRef.value?.focus()
    }

    /** Restore the chip without firing a create. */
    function cancel() {
      editing.value = false
      label.value = ''
    }

    /** Emit `create` if a non-empty label is typed; cancel otherwise. */
    function commit() {
      const trimmed = label.value.trim()

      if (!trimmed) {
        cancel()
        return
      }

      emit('create', trimmed)
      // Optimistic: clear the input but keep editing so a burst of columns
      // can be added without re-clicking.
      label.value = ''
      nextTick(() => inputRef.value?.focus())
    }

    /**
     * Blur handler: commit-on-blur with content, cancel otherwise. Avoids
     * accidental discards when the user clicks the field but never types.
     */
    function onBlur() {
      const trimmed = label.value.trim()
      if (trimmed) commit()
      else cancel()
    }
  }
}
</script>

<style lang="scss" scoped>
.add-column-button {
  @apply shrink-0;

  &__trigger {
    @apply inline-flex items-center gap-1.5 rounded-md border border-dashed border-rule-soft bg-paper-2 px-3 py-2 text-[12px] text-muted transition-colors hover:bg-paper-3 hover:text-ink;
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;
  }

  &__form {
    @apply rounded-md bg-paper-2 p-2;
  }

  &__input {
    @apply w-44 rounded-md border border-rule-soft bg-paper px-2 py-1 text-[13px] text-ink placeholder:text-muted;
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;
  }
}
</style>
