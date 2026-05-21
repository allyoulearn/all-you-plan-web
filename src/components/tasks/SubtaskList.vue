<template>
  <div class="subtask-list">
    <!-- Subtask items -->
    <ul v-if="subtasks && subtasks.length > 0" class="subtask-list__items">
      <li
        v-for="subtask in subtasks"
        :key="subtask.id"
        class="subtask-list__item"
        :class="{ 'subtask-list__item--done': subtask.completed }"
      >
        <!-- Checkbox -->
        <button
          class="subtask-list__checkbox"
          :class="{ 'subtask-list__checkbox--checked': subtask.completed }"
          :aria-label="t('tasks.complete')"
          @click="handleToggle(subtask)"
        >
          <CheckIcon class="subtask-list__check-icon" />
        </button>

        <!-- Title -->
        <span class="subtask-list__title">{{ subtask.title }}</span>
      </li>
    </ul>

    <!-- Add subtask input -->
    <div class="subtask-list__add">
      <PlusIcon class="subtask-list__add-icon" />
      <input
        ref="addInputRef"
        v-model="newTitle"
        class="subtask-list__add-input"
        :placeholder="t('tasks.addTask')"
        type="text"
        @keydown.enter.prevent="handleAdd"
        @keydown.escape="newTitle = ''"
      />
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CheckIcon, PlusIcon } from '@heroicons/vue/24/outline'

export default {
  name: 'SubtaskList',
  components: { CheckIcon, PlusIcon },
  props: {
    /** Array of subtask objects with id, title, completed */
    subtasks: {
      type: Array,
      default: () => [],
    },
    /** Parent task id */
    taskId: {
      type: String,
      required: true,
    },
  },
  emits: ['toggle-subtask', 'add-subtask'],
  setup(props, { emit }) {
    const { t } = useI18n()

    // ── State ──

    /** New subtask title being typed */
    const newTitle = ref('')

    /** Reference to the add input element */
    const addInputRef = ref(null)

    // ── Handlers ──

    /**
     * Emit toggle-subtask with the new completed state.
     * @param {Object} subtask - Subtask object
     */
    function handleToggle(subtask) {
      emit('toggle-subtask', props.taskId, subtask.id, !subtask.completed)
    }

    /**
     * Emit add-subtask if the input has content, then clear it.
     */
    function handleAdd() {
      const title = newTitle.value.trim()
      if (!title) return
      emit('add-subtask', props.taskId, title)
      newTitle.value = ''
    }

    return {
      t,
      newTitle,
      addInputRef,
      handleToggle,
      handleAdd,
    }
  },
}
</script>

<style lang="scss" scoped>
// ── Block ──
.subtask-list {
  @apply flex flex-col gap-0.5;

  // ── Items list ──
  &__items {
    @apply list-none m-0 p-0 flex flex-col gap-0.5;
  }

  &__item {
    @apply flex items-center gap-2.5 px-1 py-1.5 rounded-lg transition-colors duration-150;

    &:hover {
      @apply bg-white/5;
    }

    &--done {
      .subtask-list__title {
        @apply line-through text-secondary-600;
      }
    }
  }

  // ── Checkbox ──
  &__checkbox {
    @apply flex-shrink-0 w-4 h-4 rounded-full border border-white/20 bg-transparent cursor-pointer;
    @apply flex items-center justify-center transition-all duration-150;

    &:hover {
      @apply border-white/40 bg-white/8;
    }

    &--checked {
      @apply border-primary-400 bg-primary-500/20;
    }
  }

  &__check-icon {
    @apply w-2.5 h-2.5 text-white opacity-0 transition-opacity duration-150;

    .subtask-list__checkbox--checked & {
      @apply opacity-100;
    }
  }

  // ── Title ──
  &__title {
    @apply text-sm text-secondary-200 leading-snug flex-1 min-w-0;
  }

  // ── Add row ──
  &__add {
    @apply flex items-center gap-2.5 px-1 py-1.5 mt-0.5;
  }

  &__add-icon {
    @apply flex-shrink-0 w-4 h-4 text-secondary-600;
  }

  &__add-input {
    @apply flex-1 bg-transparent border-none outline-none text-sm;
    @apply text-secondary-300 placeholder-secondary-600;

    &:focus {
      @apply placeholder-secondary-500;
    }
  }
}
</style>
