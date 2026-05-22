<template>
  <div class="rounded-md bg-paper p-3 shadow-sm">
    <p class="text-[13px] leading-snug" :class="task.done ? 'text-muted line-through' : 'text-ink'">
      {{ task.title }}
    </p>

    <div class="mt-2.5 flex items-center gap-2">
      <Checkbox
        :model-value="task.done"
        :size="18"
        @update:model-value="emit('complete', task.id)"
      />

      <Pill v-if="task.tag" variant="default">
        {{ task.tag }}
      </Pill>
    </div>
  </div>
</template>

<script setup>
import Pill from '@/components/ui/Pill.vue'
import Checkbox from '@/components/ui/Checkbox.vue'

defineProps({
  task: { type: Object, required: true },
})
const emit = defineEmits(['complete'])
</script>
