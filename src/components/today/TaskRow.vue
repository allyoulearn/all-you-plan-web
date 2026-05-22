<template>
  <div class="flex items-center gap-3.5 rounded-lg px-2 py-3 transition-colors hover:bg-paper-3">
    <Checkbox :model-value="task.done" @update:model-value="emit('complete', task.id)" />

    <span v-if="task.scheduledTime" class="font-mono text-[11px] tracking-wide text-muted">
      {{ task.scheduledTime }}
    </span>

    <span class="min-w-0 flex-1">
      <span class="block text-[14px]" :class="task.done ? 'text-muted line-through' : 'text-ink'">
        {{ task.title }}
      </span>

      <span v-if="task.note" class="mt-0.5 block font-mono text-[11px] text-muted">
        {{ task.note }}
      </span>
    </span>

    <Pill v-if="task.tag" variant="default">
      {{ task.tag }}
    </Pill>
  </div>
</template>

<script setup>
import Checkbox from '@/components/ui/Checkbox.vue'
import Pill from '@/components/ui/Pill.vue'

defineProps({
  task: { type: Object, required: true },
})
const emit = defineEmits(['complete'])
</script>
