<template>
  <div class="quick-add-fab">
    <!-- Ambient glow behind the button -->
    <span class="quick-add-fab__glow" aria-hidden="true" />

    <!-- FAB button -->
    <button
      class="quick-add-fab__btn"
      :aria-label="t('tasks.quickAdd')"
      @click="openModal"
    >
      <PlusIcon class="quick-add-fab__icon" />
    </button>

    <!-- Quick-add modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="modalVisible"
          class="quick-add-fab__backdrop"
          @click="closeModal"
        />
      </Transition>

      <Transition name="scale-up">
        <div
          v-if="modalVisible"
          class="quick-add-fab__modal"
          role="dialog"
          aria-modal="true"
        >
          <!-- Modal header -->
          <div class="quick-add-fab__modal-header">
            <h3 class="quick-add-fab__modal-title">{{ t('tasks.quickAdd') }}</h3>
            <button class="quick-add-fab__modal-close" @click="closeModal">
              <XMarkIcon class="quick-add-fab__modal-close-icon" />
            </button>
          </div>

          <!-- Title input -->
          <input
            ref="titleInputRef"
            v-model="form.title"
            type="text"
            class="quick-add-fab__input quick-add-fab__input--title"
            :placeholder="t('tasks.title')"
            @keydown.enter="handleSubmit"
            @keydown.escape="closeModal"
          />

          <!-- Space selector -->
          <div class="quick-add-fab__field">
            <label class="quick-add-fab__label">Space</label>
            <select v-model="form.spaceId" class="quick-add-fab__select">
              <option value="">No space</option>
              <option
                v-for="space in spacesStore.activeSpaces"
                :key="space.id"
                :value="space.id"
              >
                {{ space.name }}
              </option>
            </select>
          </div>

          <!-- Quadrant chips -->
          <div class="quick-add-fab__field">
            <label class="quick-add-fab__label">{{ t('tasks.quadrant') }}</label>
            <div class="quick-add-fab__quadrant-chips">
              <button
                v-for="(cfg, key) in QUADRANT_CONFIG"
                :key="key"
                class="quick-add-fab__chip"
                :class="{ 'quick-add-fab__chip--active': form.quadrant === key }"
                :style="form.quadrant === key ? { background: cfg.color, borderColor: cfg.color } : {}"
                @click="form.quadrant = key"
              >
                {{ cfg.label }}
              </button>
            </div>
          </div>

          <!-- Due date -->
          <div class="quick-add-fab__field">
            <label class="quick-add-fab__label">{{ t('tasks.dueDate') }} (optional)</label>
            <input
              v-model="form.dueDate"
              type="date"
              class="quick-add-fab__input"
            />
          </div>

          <!-- Submit button -->
          <button
            class="quick-add-fab__submit"
            :disabled="!form.title.trim() || submitting"
            @click="handleSubmit"
          >
            <span v-if="submitting">...</span>
            <span v-else>{{ t('tasks.addTask') }}</span>
          </button>

          <!-- Error display -->
          <p v-if="error" class="quick-add-fab__error">{{ error }}</p>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script>
import { ref, reactive, nextTick, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { QUADRANT_CONFIG } from '@/utils/quadrantColors'
import { useTasksStore } from '@/stores/tasks.store'
import { useSpacesStore } from '@/stores/spaces.store'

export default {
  name: 'QuickAddFab',
  components: { PlusIcon, XMarkIcon },
  emits: ['task-created'],
  setup(_props, { emit }) {
    const { t } = useI18n()

    // ── Stores ──
    const tasksStore = useTasksStore()
    const spacesStore = useSpacesStore()

    // ── State ──

    /** Whether the quick-add modal is open */
    const modalVisible = ref(false)

    /** Whether a creation request is in flight */
    const submitting = ref(false)

    /** Error message to display on failure */
    const error = ref('')

    /** Reference to the title input element for auto-focus */
    const titleInputRef = ref(null)

    /** Reactive form values */
    const form = reactive({
      title: '',
      spaceId: '',
      quadrant: 'do',
      dueDate: '',
    })

    // ── Keyboard handler ──

    /**
     * Close modal on Escape key.
     * @param {KeyboardEvent} e
     */
    function onKeydown(e) {
      if (e.key === 'Escape' && modalVisible.value) {
        closeModal()
      }
    }

    document.addEventListener('keydown', onKeydown)

    onUnmounted(() => {
      document.removeEventListener('keydown', onKeydown)
    })

    // ── Handlers ──

    /** Open the quick-add modal and fetch spaces if not loaded */
    function openModal() {
      resetForm()
      modalVisible.value = true

      if (spacesStore.spaces.length === 0) {
        spacesStore.fetchSpaces()
      }

      nextTick(() => {
        titleInputRef.value && titleInputRef.value.focus()
      })
    }

    /** Close modal without saving */
    function closeModal() {
      modalVisible.value = false
    }

    /** Reset form to default values */
    function resetForm() {
      form.title = ''
      form.spaceId = ''
      form.quadrant = 'do'
      form.dueDate = ''
      error.value = ''
    }

    /**
     * Submit the quick-add form.
     * Calls tasksStore.createTask, then re-fetches the matrix.
     */
    async function handleSubmit() {
      const title = form.title.trim()
      if (!title || submitting.value) return

      submitting.value = true
      error.value = ''

      try {
        const input = {
          title,
          quadrant: form.quadrant,
        }

        if (form.spaceId) input.spaceId = form.spaceId
        if (form.dueDate) input.dueDate = form.dueDate

        const created = await tasksStore.createTask(input)
        await tasksStore.fetchMatrix()

        closeModal()
        emit('task-created', created)
      } catch (err) {
        error.value = t('common.error')
      } finally {
        submitting.value = false
      }
    }

    return {
      t,
      QUADRANT_CONFIG,
      tasksStore,
      spacesStore,
      modalVisible,
      submitting,
      error,
      titleInputRef,
      form,
      openModal,
      closeModal,
      handleSubmit,
    }
  },
}
</script>

<style lang="scss" scoped>
// ── FAB button ──
.quick-add-fab {
  // Positioning container; parents should set position:fixed or use it standalone
  @apply fixed bottom-8 right-8 z-30;

  &__btn {
    @apply w-14 h-14 rounded-full cursor-pointer;
    @apply flex items-center justify-center;
    @apply bg-primary-500 text-white;
    @apply transition-all duration-200;
    box-shadow: 0 0 20px rgba(27, 158, 158, 0.35), 0 4px 16px rgba(0, 0, 0, 0.3);

    &:hover {
      @apply bg-primary-400;
      box-shadow: 0 0 30px rgba(27, 158, 158, 0.55), 0 6px 20px rgba(0, 0, 0, 0.35);
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.97);
    }
  }

  &__icon {
    @apply w-7 h-7;
  }

  &__glow {
    @apply absolute rounded-full pointer-events-none;
    top: 0;
    left: 0;
    width: 56px;
    height: 56px;
    background: radial-gradient(circle, rgba(27, 158, 158, 0.45) 0%, transparent 70%);
    animation: glowPulse 2.4s ease-in-out infinite;
  }
}

// ── Backdrop ──
.quick-add-fab__backdrop {
  @apply fixed inset-0 z-40;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
}

// ── Modal ──
.quick-add-fab__modal {
  @apply fixed z-50 flex flex-col gap-4;
  @apply border border-white/10 rounded-glass;
  @apply px-5 py-5;
  background: rgba(13, 26, 45, 0.95);
  backdrop-filter: blur(24px);
  box-shadow: 0 20px 60px -12px rgba(0, 0, 0, 0.5);
  width: min(100vw - 2rem, 400px);
  // Center horizontally, position above FAB
  bottom: 7rem;
  right: 2rem;

  // ── Header ──
  &-header {
    @apply flex items-center justify-between;
  }

  &-title {
    @apply text-base font-semibold text-secondary-100 m-0;
  }

  &-close {
    @apply w-7 h-7 flex items-center justify-center rounded-full cursor-pointer;
    @apply border border-white/10 bg-white/5 text-secondary-400;
    @apply transition-all duration-150;

    &:hover {
      @apply bg-white/10 text-secondary-200;
    }
  }

  &-close-icon {
    @apply w-4 h-4;
  }
}

// ── Shared field/label styles ──
.quick-add-fab {
  &__field {
    @apply flex flex-col gap-1.5;
  }

  &__label {
    @apply text-xs font-medium text-secondary-500 uppercase tracking-wider;
  }

  // ── Inputs ──
  &__input {
    @apply w-full bg-white/5 border border-white/10 rounded-input;
    @apply px-3 py-2 text-sm text-secondary-200 outline-none;
    @apply transition-all duration-150;

    &:focus {
      background: rgba(255, 255, 255, 0.08);
    }

    &--title {
      @apply text-base font-medium;
      @apply border-transparent bg-transparent px-0;

      &:focus {
        @apply border-transparent bg-transparent;
      }

      &::placeholder {
        @apply text-secondary-600 font-normal;
      }
    }

    // Dark color scheme for native date picker
    color-scheme: dark;
  }

  // ── Space select ──
  &__select {
    @apply w-full bg-white/5 border border-white/10 rounded-input;
    @apply px-3 py-2 text-sm text-secondary-200 outline-none;
    @apply transition-all duration-150;
    color-scheme: dark;

    &:focus {
      @apply border-primary-400/50;
    }

    option {
      @apply bg-secondary-900 text-secondary-200;
    }
  }

  // ── Quadrant chips ──
  &__quadrant-chips {
    @apply flex flex-wrap gap-2;
  }

  &__chip {
    @apply px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer;
    @apply border border-white/10 bg-white/5 text-secondary-400;
    @apply transition-all duration-150;

    &:hover {
      @apply bg-white/10 text-secondary-200;
    }

    &--active {
      @apply text-white border-transparent;
    }
  }

  // ── Submit ──
  &__submit {
    @apply w-full py-2.5 rounded-btn text-sm font-semibold cursor-pointer;
    @apply bg-primary-500 text-white border-none;
    @apply transition-all duration-150;

    &:hover:not(:disabled) {
      @apply bg-primary-400;
    }

    &:disabled {
      @apply opacity-40 cursor-not-allowed;
    }
  }

  // ── Error ──
  &__error {
    @apply text-xs text-danger m-0 text-center;
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

.scale-up-enter-active,
.scale-up-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.scale-up-enter-from,
.scale-up-leave-to {
  transform: scale(0.95) translateY(8px);
  opacity: 0;
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50%      { opacity: 1; transform: scale(1.12); }
}
</style>
