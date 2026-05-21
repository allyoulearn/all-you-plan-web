<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="visible"
        class="slide-over__backdrop"
        @click="handleClose"
      />
    </Transition>

    <!-- Panel -->
    <Transition name="slide-right">
      <div
        v-if="visible"
        class="slide-over"
        role="dialog"
        aria-modal="true"
      >
        <!-- Close button -->
        <button class="slide-over__close" :aria-label="t('common.cancel')" @click="handleClose">
          <XMarkIcon class="slide-over__close-icon" />
        </button>

        <!-- Auto-save indicator -->
        <Transition name="fade">
          <span v-if="savedVisible" class="slide-over__saved">{{ t('common.saved') }}</span>
        </Transition>

        <template v-if="task">
          <!-- AI suggestion banner -->
          <div
            v-if="task.suggestedQuadrant && task.suggestedQuadrant !== localTask.quadrant && !suggestionDismissed"
            class="slide-over__ai-banner"
          >
            <SparklesIcon class="slide-over__ai-icon" />
            <span class="slide-over__ai-text">
              AI suggests: Move to
              <strong>{{ quadrantLabel(task.suggestedQuadrant) }}</strong>
            </span>
            <div class="slide-over__ai-actions">
              <button class="slide-over__ai-accept" @click="acceptSuggestion">Accept</button>
              <button class="slide-over__ai-dismiss" @click="suggestionDismissed = true">
                <XMarkIcon class="slide-over__ai-dismiss-icon" />
              </button>
            </div>
          </div>

          <!-- Scrollable content area -->
          <div class="slide-over__body">
            <!-- Title -->
            <textarea
              ref="titleRef"
              v-model="localTask.title"
              class="slide-over__title-input"
              :placeholder="t('tasks.title')"
              rows="2"
              @input="scheduleSave"
            />

            <!-- Description -->
            <textarea
              v-model="localTask.description"
              class="slide-over__description"
              :placeholder="t('tasks.description')"
              rows="3"
              @input="scheduleSave"
            />

            <!-- Divider -->
            <hr class="slide-over__divider" />

            <!-- Quadrant selector -->
            <div class="slide-over__field">
              <label class="slide-over__label">{{ t('tasks.quadrant') }}</label>
              <div class="slide-over__quadrant-chips">
                <button
                  v-for="(cfg, key) in QUADRANT_CONFIG"
                  :key="key"
                  class="slide-over__quadrant-chip"
                  :class="{ 'slide-over__quadrant-chip--active': localTask.quadrant === key }"
                  :style="localTask.quadrant === key ? { background: cfg.color, borderColor: cfg.color } : {}"
                  @click="selectQuadrant(key)"
                >
                  <CheckIcon
                    v-if="localTask.quadrant === key"
                    class="slide-over__quadrant-check"
                  />
                  {{ cfg.label }}
                </button>
              </div>
            </div>

            <!-- Due date -->
            <div class="slide-over__field">
              <label class="slide-over__label">{{ t('tasks.dueDate') }}</label>
              <input
                v-model="localTask.dueDate"
                type="date"
                class="slide-over__input"
                @change="scheduleSave"
              />
            </div>

            <!-- Effort -->
            <div class="slide-over__field">
              <label class="slide-over__label">{{ t('tasks.effort') }}</label>
              <input
                v-model.number="localTask.effort"
                type="number"
                min="0"
                class="slide-over__input slide-over__input--short"
                :placeholder="'0'"
                @input="scheduleSave"
              />
            </div>

            <!-- Recurrence (read-only) -->
            <div v-if="task.recurrence" class="slide-over__field">
              <label class="slide-over__label">Recurrence</label>
              <p class="slide-over__recurrence">Repeats: {{ task.recurrence }}</p>
            </div>

            <!-- Divider -->
            <hr class="slide-over__divider" />

            <!-- Subtasks -->
            <div class="slide-over__field">
              <label class="slide-over__label">{{ t('tasks.subtasks') }}</label>
              <SubtaskList
                :subtasks="localTask.subtasks || []"
                :task-id="task.id"
                @toggle-subtask="handleToggleSubtask"
                @add-subtask="handleAddSubtask"
              />
            </div>
          </div>

          <!-- Bottom actions -->
          <div class="slide-over__actions">
            <button class="slide-over__btn slide-over__btn--save" @click="handleSave">
              {{ t('common.save') }}
            </button>

            <button class="slide-over__btn slide-over__btn--snooze" @click="showSnooze = !showSnooze">
              {{ t('tasks.snooze') }}
            </button>

            <button class="slide-over__btn slide-over__btn--delete" @click="handleDelete">
              {{ t('tasks.delete') }}
            </button>
          </div>

          <!-- Snooze date picker -->
          <Transition name="slide-up">
            <div v-if="showSnooze" class="slide-over__snooze">
              <label class="slide-over__label">Snooze until</label>
              <input
                v-model="snoozeDate"
                type="date"
                class="slide-over__input"
              />
              <button class="slide-over__btn slide-over__btn--save" @click="handleSnooze">
                Confirm snooze
              </button>
            </div>
          </Transition>
        </template>

        <!-- Empty state when no task is provided -->
        <div v-else class="slide-over__empty">
          <p class="slide-over__empty-text">Select a task to view details</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import { ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { XMarkIcon, SparklesIcon, CheckIcon } from '@heroicons/vue/24/outline'
import { QUADRANT_CONFIG } from '@/utils/quadrantColors'
import SubtaskList from './SubtaskList.vue'

export default {
  name: 'TaskSlideOver',
  components: { XMarkIcon, SparklesIcon, CheckIcon, SubtaskList },
  props: {
    /** Task object to display and edit, or null when closed */
    task: {
      type: Object,
      default: null,
    },
    /** Whether the slide-over is visible */
    visible: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close', 'save', 'delete', 'complete', 'snooze'],
  setup(props, { emit }) {
    const { t } = useI18n()

    // ── State ──

    /** Local copy of the task being edited */
    const localTask = ref({})

    /** Whether the AI suggestion banner has been dismissed */
    const suggestionDismissed = ref(false)

    /** Whether the snooze date picker is visible */
    const showSnooze = ref(false)

    /** The selected snooze date string */
    const snoozeDate = ref('')

    /** Reference to the title textarea for auto-focus */
    const titleRef = ref(null)

    /** Briefly true after an auto-save completes, drives the "Saved" pill. */
    const savedVisible = ref(false)

    /** Debounce timer handle */
    let saveTimer = null

    // ── Watchers ──

    /**
     * Sync the local task copy whenever the prop changes.
     * Also resets per-open state.
     */
    watch(
      () => props.task,
      (newTask) => {
        if (newTask) {
          localTask.value = { ...newTask }
        }
        suggestionDismissed.value = false
        showSnooze.value = false
        snoozeDate.value = ''

        if (newTask && props.visible) {
          nextTick(() => {
            titleRef.value && titleRef.value.focus()
          })
        }
      },
      { immediate: true }
    )

    /**
     * Focus title when panel becomes visible.
     */
    watch(
      () => props.visible,
      (val) => {
        if (val && props.task) {
          nextTick(() => {
            titleRef.value && titleRef.value.focus()
          })
        }
        if (!val) {
          clearTimeout(saveTimer)
        }
      }
    )

    // ── Keyboard handler ──

    /**
     * Close on Escape key. Attached to the document so it works even when
     * focus is inside an input.
     */
    function onKeydown(e) {
      if (e.key === 'Escape' && props.visible) {
        handleClose()
      }
    }

    watch(
      () => props.visible,
      (val) => {
        if (val) {
          document.addEventListener('keydown', onKeydown)
        } else {
          document.removeEventListener('keydown', onKeydown)
        }
      },
      { immediate: true }
    )

    // ── Helpers ──

    /**
     * Returns the label string for a given quadrant key.
     * @param {string} key - Quadrant key
     * @returns {string}
     */
    function quadrantLabel(key) {
      return QUADRANT_CONFIG[key]?.label ?? key
    }

    // ── Auto-save ──

    /**
     * Schedule a debounced save after 500ms of no further changes.
     */
    function scheduleSave() {
      clearTimeout(saveTimer)
      saveTimer = setTimeout(() => {
        emitSave()
      }, 500)
    }

    // ── Handlers ──

    /** Emit close event */
    function handleClose() {
      clearTimeout(saveTimer)
      emit('close')
    }

    /** Collect changed fields and emit save */
    function handleSave() {
      clearTimeout(saveTimer)
      emitSave()
    }

    /** Build diff and emit save with updated fields; flash the "Saved" pill. */
    function emitSave() {
      if (!props.task) return
      emit('save', { ...localTask.value })
      savedVisible.value = true
      setTimeout(() => {
        savedVisible.value = false
      }, 1500)
    }

    /** Emit delete with the task id */
    function handleDelete() {
      emit('delete', props.task.id)
    }

    /** Set the quadrant on the local copy and schedule save */
    function selectQuadrant(key) {
      localTask.value = { ...localTask.value, quadrant: key }
      scheduleSave()
    }

    /** Apply the AI-suggested quadrant and schedule save */
    function acceptSuggestion() {
      localTask.value = { ...localTask.value, quadrant: props.task.suggestedQuadrant }
      suggestionDismissed.value = true
      scheduleSave()
    }

    /** Emit snooze with the task id and selected date */
    function handleSnooze() {
      if (!snoozeDate.value) return
      emit('snooze', props.task.id, snoozeDate.value)
      showSnooze.value = false
      snoozeDate.value = ''
    }

    /** Delegate subtask toggle to parent */
    function handleToggleSubtask(taskId, subtaskId, completed) {
      emit('save', { id: taskId, _subtaskToggle: { subtaskId, completed } })
    }

    /** Delegate subtask creation to parent */
    function handleAddSubtask(taskId, title) {
      emit('save', { id: taskId, _addSubtask: { title } })
    }

    return {
      t,
      QUADRANT_CONFIG,
      localTask,
      suggestionDismissed,
      showSnooze,
      snoozeDate,
      titleRef,
      savedVisible,
      quadrantLabel,
      scheduleSave,
      handleClose,
      handleSave,
      handleDelete,
      selectQuadrant,
      acceptSuggestion,
      handleSnooze,
      handleToggleSubtask,
      handleAddSubtask,
    }
  },
}
</script>

<style lang="scss" scoped>
// ── Backdrop ──
.slide-over__backdrop {
  @apply fixed inset-0 z-40;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

// ── Panel ──
.slide-over {
  @apply fixed top-0 right-0 bottom-0 z-50 flex flex-col;
  @apply border-l border-white/10;
  width: min(100vw, 420px);
  background: rgba(13, 26, 45, 0.92);
  backdrop-filter: blur(24px);
  box-shadow: -8px 0 40px rgba(0, 0, 0, 0.4);

  // ── Close button ──
  &__close {
    @apply absolute top-4 right-4 z-10;
    @apply w-8 h-8 flex items-center justify-center rounded-full;
    @apply border border-white/10 bg-white/5 text-secondary-400 cursor-pointer;
    @apply transition-all duration-150;

    &:hover {
      @apply border-white/20 bg-white/10 text-secondary-200;
    }
  }

  &__close-icon {
    @apply w-4 h-4;
  }

  // ── Auto-save indicator ──
  &__saved {
    @apply absolute top-5 right-16 z-10 px-2 py-0.5 rounded-full;
    @apply text-xs font-medium text-primary-200;
    background: rgba(27, 158, 158, 0.18);
    border: 1px solid rgba(27, 158, 158, 0.3);
  }

  // ── AI suggestion banner ──
  &__ai-banner {
    @apply flex items-center gap-2 px-4 py-2.5 flex-shrink-0;
    @apply bg-primary-500/10 border-b border-primary-400/20;
  }

  &__ai-icon {
    @apply w-4 h-4 text-primary-400 flex-shrink-0;
  }

  &__ai-text {
    @apply text-xs text-primary-300 flex-1;

    strong {
      @apply font-semibold text-primary-200;
    }
  }

  &__ai-actions {
    @apply flex items-center gap-1 flex-shrink-0;
  }

  &__ai-accept {
    @apply text-xs px-2 py-1 rounded-md font-medium cursor-pointer;
    @apply bg-primary-500/20 text-primary-300 border border-primary-400/30;
    @apply transition-all duration-150;

    &:hover {
      @apply bg-primary-500/30 text-primary-200;
    }
  }

  &__ai-dismiss {
    @apply w-6 h-6 flex items-center justify-center rounded-full cursor-pointer;
    @apply text-secondary-500 transition-colors duration-150;

    &:hover {
      @apply text-secondary-300;
    }
  }

  &__ai-dismiss-icon {
    @apply w-3.5 h-3.5;
  }

  // ── Scrollable body ──
  &__body {
    @apply flex-1 overflow-y-auto px-5 pt-12 pb-4;
    @apply flex flex-col gap-4;
  }

  // ── Title input ──
  &__title-input {
    @apply w-full bg-transparent border-none outline-none resize-none;
    @apply text-xl font-semibold text-secondary-50 placeholder-secondary-600;
    @apply leading-snug;
    font-size: 1.25rem;

    &:focus {
      @apply placeholder-secondary-500;
    }
  }

  // ── Description textarea ──
  &__description {
    @apply w-full bg-transparent border-none outline-none resize-none;
    @apply text-sm text-secondary-300 placeholder-secondary-600 leading-relaxed;

    &:focus {
      @apply placeholder-secondary-500;
    }
  }

  // ── Divider ──
  &__divider {
    @apply border-t border-white/10 my-0;
  }

  // ── Field wrapper ──
  &__field {
    @apply flex flex-col gap-1.5;
  }

  &__label {
    @apply text-xs font-medium text-secondary-500 uppercase tracking-wider;
  }

  // ── Standard input ──
  &__input {
    @apply w-full bg-white/5 border border-white/10 rounded-input;
    @apply px-3 py-2 text-sm text-secondary-200 outline-none;
    @apply transition-all duration-150;

    &:focus {
      background: rgba(255, 255, 255, 0.08);
    }

    &--short {
      @apply w-24;
    }

    // Date input color fix on dark backgrounds
    color-scheme: dark;
  }

  // ── Quadrant chips ──
  &__quadrant-chips {
    @apply flex flex-wrap gap-2;
  }

  &__quadrant-chip {
    @apply inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer;
    @apply border border-white/10 bg-white/5 text-secondary-400;
    @apply transition-all duration-150;

    &:hover {
      @apply bg-white/10 text-secondary-200;
    }

    &--active {
      @apply text-white border-transparent;
    }
  }

  &__quadrant-check {
    @apply w-3 h-3;
  }

  // ── Recurrence ──
  &__recurrence {
    @apply text-sm text-secondary-400 m-0;
  }

  // ── Bottom actions ──
  &__actions {
    @apply flex items-center gap-2 px-5 py-4 border-t border-white/10 flex-shrink-0;
  }

  &__btn {
    @apply px-4 py-2 rounded-btn text-sm font-medium cursor-pointer;
    @apply transition-all duration-150;

    &--save {
      @apply flex-1 bg-primary-500 text-white border-none;

      &:hover {
        @apply bg-primary-400;
      }
    }

    &--snooze {
      @apply bg-white/5 border border-white/10 text-secondary-300;

      &:hover {
        @apply bg-white/10 text-secondary-100;
      }
    }

    &--delete {
      @apply bg-danger/10 border border-danger/30 text-danger;

      &:hover {
        @apply bg-danger/20;
      }
    }
  }

  // ── Snooze date picker ──
  &__snooze {
    @apply flex items-center gap-3 px-5 py-3 border-t flex-shrink-0;
    border-top-color: rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.03);
  }

  // ── Empty state ──
  &__empty {
    @apply flex-1 flex items-center justify-center;
  }

  &__empty-text {
    @apply text-sm text-secondary-600 italic;
  }
}

// ── Transitions ──
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(8px);
  opacity: 0;
}
</style>
