<template>
  <div class="task-row">
    <Checkbox :model-value="task.done" @update:model-value="$emit('complete', task.id)" />

    <span v-if="task.scheduledTime" class="task-row__time">
      {{ formattedTime }}
    </span>

    <span class="task-row__body">
      <span
        class="task-row__title"
        :class="task.done ? 'task-row__title--done' : 'task-row__title--pending'"
      >
        {{ task.title }}
      </span>

      <span v-if="task.note" class="task-row__note">
        {{ task.note }}
      </span>
    </span>

    <Pill v-if="task.tag" variant="default">
      {{ task.tag }}
    </Pill>
  </div>
</template>

<script>
/** TaskRow — single task entry with completion checkbox, scheduled time, title, note, and tag. */
import { computed } from 'vue'
import Checkbox from '@/components/ui/Checkbox.vue'
import Pill from '@/components/ui/Pill.vue'

export default {
  name: 'TaskRow',
  components: { Checkbox, Pill },
  props: {
    /** The task object to display */
    task: { type: Object, required: true }
  },
  emits: ['complete'],
  setup(props) {
    /**
     * Format the scheduled time per the user's locale (WEB-W3-15). The API
     * stores `HH:mm` (24-hour); we parse it and format via toLocaleTimeString
     * with the browser's default locale so 12-hour locales see "2:30 PM" and
     * 24-hour locales see "14:30". Falls back to the raw string if the
     * value isn't parseable.
     */
    const formattedTime = computed(() => {
      const raw = props.task.scheduledTime
      if (!raw) return ''
      const match = /^(\d{1,2}):(\d{2})/.exec(raw)
      if (!match) return raw
      const h = Number(match[1])
      const m = Number(match[2])
      if (!Number.isFinite(h) || !Number.isFinite(m)) return raw
      const d = new Date()
      d.setHours(h, m, 0, 0)
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    })

    return { formattedTime }
  }
}
</script>

<style lang="scss" scoped>
.task-row {
  @apply flex items-center gap-3.5 rounded-lg px-2 py-3 transition-colors hover:bg-paper-3;

  &__time {
    @apply font-mono text-[11px] tracking-wide text-muted;
  }

  &__body {
    @apply min-w-0 flex-1;
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
