<template>
  <div class="flex items-center gap-3.5 rounded-lg px-2 py-3 transition-colors hover:bg-paper-3">
    <Checkbox
      :model-value="isCompletedToday(chore.lastCompletedOn)"
      @update:model-value="emit('complete', chore.id)"
    />

    <span class="min-w-0 flex-1">
      <span
        class="block text-[14px]"
        :class="isCompletedToday(chore.lastCompletedOn) ? 'text-muted' : 'text-ink'"
      >
        {{ chore.title }}
      </span>
    </span>

    <Pill variant="default">
      {{ chore.cadence.type }}
    </Pill>

    <span class="font-mono text-[11px] tracking-wide text-muted">
      {{ chore.streak }}d
    </span>
  </div>
</template>

<script setup>
import Checkbox from '@/components/ui/Checkbox.vue'
import Pill from '@/components/ui/Pill.vue'

defineProps({
  chore: { type: Object, required: true },
})
const emit = defineEmits(['complete'])

function isCompletedToday(lastCompletedOn) {
  if (!lastCompletedOn) return false
  const today = new Date().toISOString().slice(0, 10)
  return lastCompletedOn.slice(0, 10) === today
}
</script>
