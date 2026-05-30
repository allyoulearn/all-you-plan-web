<template>
  <div class="task-row">
    <!-- Completion checkbox -->
    <AppCheckbox :model-value="task.done" @update:model-value="$emit('complete', task.id)" />

    <!-- Scheduled time -->
    <span v-if="task.scheduledTime" class="task-row__time">
      {{ formattedTime }}
    </span>

    <!-- Title, Wren badge, and note -->
    <span class="task-row__body">
      <span class="task-row__title-row">
        <span
          class="task-row__title"
          :class="task.done ? 'task-row__title--done' : 'task-row__title--pending'"
        >
          {{ task.title }}
        </span>

        <WrenOriginBadge ref-type="task" :ref-id="task.id" />
      </span>

      <span v-if="task.note" class="task-row__note">
        {{ task.note }}
      </span>
    </span>

    <!-- Tag pill -->
    <AppPill v-if="task.tag" variant="default">
      {{ task.tag }}
    </AppPill>
  </div>
</template>

<script>
/** TaskRow — single task entry with completion checkbox, scheduled time, title, note, and tag. */
import { computed } from 'vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import AppPill from '@/components/ui/AppPill.vue'
import WrenOriginBadge from '@/components/wren/WrenOriginBadge.vue'
import { formatTime } from '@/utils/date.js'

export default {
  name: 'TaskRow',
  components: { AppCheckbox, AppPill, WrenOriginBadge },
  props: {
    /** The task object to display */
    task: { type: Object, required: true }
  },
  emits: ['complete'],
  setup(props) {
    // -- Computed --
    /**
     * Format the scheduled time per the user's locale. The API stores `HH:mm`
     * (24-hour); `formatTime` parses it and returns a short locale-aware
     * string so 12-hour locales see "2:30 PM" and 24-hour locales see "14:30".
     */
    const formattedTime = computed(() => formatTime(props.task.scheduledTime))

    return { formattedTime }
  }
}
</script>

<style lang="scss" scoped>
.task-row {
  // rounded-md matches the parent .today-view__task-group card so the hover
  // overlay reads as inset inside the card rather than a different shape
  // floating on top.
  @apply flex items-center gap-3.5 rounded-md px-2 py-3 transition-colors hover:bg-paper-3;

  &__time {
    @apply font-mono text-[11px] tracking-wide text-muted;
  }

  &__body {
    @apply min-w-0 flex-1;
  }

  &__title-row {
    @apply flex items-center gap-1.5;
  }

  &__title {
    @apply block text-[14px];

    &--done {
      @apply text-muted line-through;
    }

    &--pending {
      @apply text-ink;
    }
  }

  &__note {
    @apply mt-0.5 block font-mono text-[11px] text-muted;
  }
}
</style>
