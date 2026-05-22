<template>
  <!-- User bubble: right-aligned on paper-3 -->
  <div v-if="message.sender === 'user'" class="flex justify-end">
    <div class="max-w-[75%]">
      <p class="mb-1 text-right font-mono text-[10px] tracking-wide text-muted">
        {{ formatWhen(message.createdAt) }}
      </p>

      <div class="rounded-tl-xl rounded-tr-xl rounded-bl-xl rounded-br-sm bg-paper-3 px-4 py-3 text-[14px] leading-relaxed text-ink">
        {{ message.text }}
      </div>
    </div>
  </div>

  <!-- Coach bubble: left-aligned, accent when actions present -->
  <div v-else class="flex justify-start">
    <div class="max-w-[80%]">
      <p class="mb-1 font-mono text-[10px] tracking-wide text-muted">
        {{ formatWhen(message.createdAt) }}
      </p>

      <div
        class="rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-sm px-4 py-3 text-[14px] leading-relaxed"
        :class="
          message.actions && message.actions.length
            ? 'bg-accent text-accent-ink shadow-accent-glow'
            : 'bg-paper-2 text-ink'
        "
      >
        {{ message.text }}
      </div>

      <div v-if="message.actions && message.actions.length" class="mt-2 flex flex-wrap gap-2">
        <Button
          v-for="action in message.actions"
          :key="action"
          variant="ghost"
          size="sm"
          @click="emit('action', action)"
        >
          {{ action }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import Button from '@/components/ui/Button.vue'

defineProps({
  message: { type: Object, required: true },
})

const emit = defineEmits(['action'])

function formatWhen(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>
