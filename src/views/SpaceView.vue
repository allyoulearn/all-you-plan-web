<template>
  <div class="space-view">

    <!-- Loading state -->
    <div v-if="loading" class="space-view__loading">
      <span class="space-view__spinner" />
      <span class="space-view__loading-text">{{ t('common.loading') }}</span>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="space-view__header">
        <span
          class="space-view__dot"
          :style="{ background: space ? (space.color || '#3ec4c4') : '#3ec4c4' }"
        />
        <h1 class="space-view__title">{{ space ? space.name : '' }}</h1>
        <span class="space-view__task-count">
          {{ filteredTasks.length }} {{ filteredTasks.length === 1 ? 'task' : 'tasks' }}
        </span>
      </div>

      <!-- Filter bar -->
      <div class="space-view__filters">
        <!-- Quadrant chips -->
        <div class="space-view__quadrant-chips">
          <button
            class="space-view__chip"
            :class="{ 'space-view__chip--active': quadrantFilter === 'all' }"
            @click="quadrantFilter = 'all'"
          >
            All
          </button>
          <button
            v-for="(cfg, key) in QUADRANT_CONFIG"
            :key="key"
            class="space-view__chip"
            :class="{ 'space-view__chip--active': quadrantFilter === key }"
            :style="quadrantFilter === key ? { background: cfg.color, borderColor: cfg.color } : {}"
            @click="quadrantFilter = key"
          >
            {{ cfg.label }}
          </button>
        </div>

        <!-- Status dropdown -->
        <select
          v-model="statusFilter"
          class="space-view__status-select"
        >
          <option value="all">All statuses</option>
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
        </select>
      </div>

      <!-- Task list -->
      <ul v-if="filteredTasks.length > 0" class="space-view__task-list">
        <TaskRow
          v-for="task in filteredTasks"
          :key="task.id"
          :task="task"
          @select="handleSelectTask"
          @complete="handleCompleteTask"
        />
      </ul>

      <!-- Empty state -->
      <div v-else class="space-view__empty">
        <FolderOpenIcon class="space-view__empty-icon" />
        <p class="space-view__empty-text">{{ t('tasks.noTasks') }}</p>
      </div>
    </template>

    <!-- Task slide-over -->
    <TaskSlideOver
      :task="selectedTask"
      :visible="slideOverVisible"
      @close="handleCloseSlideOver"
      @save="handleSaveTask"
      @delete="handleDeleteTask"
    />

    <!-- Quick add FAB -->
    <QuickAddFab @task-created="handleTaskCreated" />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { FolderOpenIcon } from '@heroicons/vue/24/outline'
import { useTasksStore } from '@/stores/tasks.store'
import { useSpacesStore } from '@/stores/spaces.store'
import { QUADRANT_CONFIG } from '@/utils/quadrantColors'
import TaskRow from '@/components/tasks/TaskRow.vue'
import TaskSlideOver from '@/components/tasks/TaskSlideOver.vue'
import QuickAddFab from '@/components/tasks/QuickAddFab.vue'

export default {
  name: 'SpaceView',
  components: {
    FolderOpenIcon,
    TaskRow,
    TaskSlideOver,
    QuickAddFab,
  },
  setup() {
    const { t } = useI18n()
    const route = useRoute()
    const tasksStore = useTasksStore()
    const spacesStore = useSpacesStore()

    // ── State ──

    /** The space object fetched from the store */
    const space = ref(null)

    /** Whether the initial fetch is in progress */
    const loading = ref(false)

    /** Currently selected quadrant filter key, or 'all' */
    const quadrantFilter = ref('all')

    /** Currently selected status filter, or 'all' */
    const statusFilter = ref('all')

    /** Task shown in the slide-over panel */
    const selectedTask = ref(null)

    /** Whether the slide-over is visible */
    const slideOverVisible = ref(false)

    // ── Computed ──

    /**
     * Tasks filtered by the chosen quadrant and status chips.
     * @returns {Array}
     */
    const filteredTasks = computed(() => {
      return tasksStore.tasks.filter(task => {
        if (quadrantFilter.value !== 'all' && task.quadrant !== quadrantFilter.value) {
          return false
        }
        if (statusFilter.value !== 'all' && task.status !== statusFilter.value) {
          return false
        }
        return true
      })
    })

    // ── Lifecycle ──

    onMounted(async () => {
      const id = route.params.id
      loading.value = true
      try {
        space.value = await spacesStore.fetchSpace(id)
        await tasksStore.fetchTasks({ spaceId: id })
      } finally {
        loading.value = false
      }
    })

    // ── Handlers ──

    /**
     * Open slide-over for the selected task.
     * @param {Object} task
     */
    function handleSelectTask(task) {
      selectedTask.value = task
      slideOverVisible.value = true
    }

    /** Close the slide-over and clear the selection. */
    function handleCloseSlideOver() {
      slideOverVisible.value = false
      selectedTask.value = null
    }

    /**
     * Complete a task and re-fetch to keep the list current.
     * @param {string} id - Task id
     */
    async function handleCompleteTask(id) {
      await tasksStore.completeTask(id)
      await tasksStore.fetchTasks({ spaceId: route.params.id })
    }

    /**
     * Save updates for the task currently in the slide-over.
     * @param {Object} updated
     */
    async function handleSaveTask(updated) {
      await tasksStore.updateTask(updated.id, updated)
    }

    /**
     * Delete the task in the slide-over then close it.
     * @param {string} id
     */
    async function handleDeleteTask(id) {
      await tasksStore.deleteTask(id)
      handleCloseSlideOver()
    }

    /**
     * After a new task is created via the FAB, re-fetch to show it.
     */
    async function handleTaskCreated() {
      await tasksStore.fetchTasks({ spaceId: route.params.id })
    }

    return {
      t,
      QUADRANT_CONFIG,
      space,
      loading,
      quadrantFilter,
      statusFilter,
      filteredTasks,
      selectedTask,
      slideOverVisible,
      handleSelectTask,
      handleCloseSlideOver,
      handleCompleteTask,
      handleSaveTask,
      handleDeleteTask,
      handleTaskCreated,
    }
  },
}
</script>

<style lang="scss" scoped>
// ── Block ──
.space-view {
  @apply flex flex-col gap-4 p-4 min-h-0;

  // ── Loading ──
  &__loading {
    @apply flex flex-col items-center justify-center gap-3 py-16 text-secondary-500;
  }

  &__spinner {
    @apply w-8 h-8 rounded-full border-2 border-white/10 border-t-primary-500 animate-spin;
    display: block;
  }

  &__loading-text {
    @apply text-sm;
  }

  // ── Header ──
  &__header {
    @apply flex items-center gap-3;
  }

  &__dot {
    @apply w-3.5 h-3.5 rounded-full flex-shrink-0;
  }

  &__title {
    @apply text-2xl font-semibold text-white m-0 flex-1 min-w-0 truncate;
  }

  &__task-count {
    @apply text-sm text-secondary-500 flex-shrink-0;
  }

  // ── Filter bar ──
  &__filters {
    @apply flex items-center gap-3 flex-wrap;
  }

  &__quadrant-chips {
    @apply flex items-center gap-1.5 flex-wrap;
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
      background: rgba(62, 196, 196, 0.25);
      border-color: rgba(62, 196, 196, 0.4);
    }
  }

  &__status-select {
    @apply bg-white/5 border border-white/10 rounded-input ml-auto;
    @apply px-3 py-1.5 text-xs text-secondary-300 outline-none;
    @apply transition-all duration-150;
    color-scheme: dark;

    &:focus {
      @apply border-primary-400/50;
    }

    option {
      @apply bg-secondary-900 text-secondary-200;
    }
  }

  // ── Task list ──
  &__task-list {
    @apply flex flex-col m-0 p-0;
    @apply border border-white/10 rounded-glass backdrop-blur-glass;
    background: rgba(255, 255, 255, 0.03);
  }

  // ── Empty state ──
  &__empty {
    @apply flex flex-col items-center justify-center gap-3 py-20 text-secondary-500;
    @apply border border-white/10 rounded-glass;
    background: rgba(255, 255, 255, 0.02);
  }

  &__empty-icon {
    @apply w-12 h-12 opacity-40 text-primary-400;
  }

  &__empty-text {
    @apply text-sm m-0;
  }
}
</style>
