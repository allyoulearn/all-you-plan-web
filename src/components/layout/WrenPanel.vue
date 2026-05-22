<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import WrenBubble from '@/components/wren/WrenBubble.vue'
import { useWrenStore } from '@/stores/wren.store'

const store = useWrenStore()
const draft = ref('')
const bodyRef = ref(null)

const QUICK_PROMPTS = [
  "What should I focus on?",
  "I'm feeling overwhelmed.",
  "Plan tomorrow",
  "I need a rest.",
]

onMounted(() => store.load())

function scrollToBottom() {
  nextTick(() => {
    if (bodyRef.value) {
      bodyRef.value.scrollTop = bodyRef.value.scrollHeight
    }
  })
}

watch(() => store.messages.length, scrollToBottom)

async function sendMessage() {
  const text = draft.value.trim()
  if (!text || store.sending) return
  draft.value = ''
  await store.send(text)
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

function fillFromChip(prompt) {
  draft.value = prompt
}
</script>

<template>
  <aside class="flex h-screen flex-col overflow-hidden border-l border-rule-soft bg-paper">
    <!-- Header -->
    <div class="flex items-center gap-3 border-b border-rule-soft px-[22px] py-[18px]">
      <span class="grid h-9 w-9 place-items-center rounded-pill bg-accent font-serif text-[20px] italic text-accent-ink">
        W
      </span>
      <div>
        <p class="font-serif text-[22px] italic leading-none text-ink">Wren</p>
        <p class="mt-0.5 text-[12px] text-muted">Your coach</p>
      </div>
      <span class="ml-auto inline-flex items-center gap-1.5 text-[11px] text-muted">
        <span class="h-[7px] w-[7px] rounded-pill bg-ok" />
        live
      </span>
    </div>

    <!-- Messages body -->
    <div ref="bodyRef" class="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-5">
      <div v-if="store.loading" class="text-center text-[13px] text-muted">Loading…</div>
      <template v-else-if="store.messages.length">
        <WrenBubble
          v-for="msg in store.messages"
          :key="msg.id"
          :message="msg"
          @action="fillFromChip"
        />
      </template>
      <div v-else class="flex flex-1 items-center justify-center text-center">
        <p class="text-[13px] text-muted">Say hello to Wren.</p>
      </div>
    </div>

    <!-- Quick-prompt chips -->
    <div class="flex flex-wrap gap-2 px-4 pb-2">
      <button
        v-for="prompt in QUICK_PROMPTS"
        :key="prompt"
        class="rounded-pill border border-rule-soft bg-paper-2 px-3 py-1 text-[11px] text-muted transition-colors hover:bg-paper-3 hover:text-ink"
        @click="fillFromChip(prompt)"
      >
        {{ prompt }}
      </button>
    </div>

    <!-- Input footer -->
    <div class="border-t border-rule-soft p-4">
      <div class="flex items-center gap-2 rounded-pill border border-rule-soft bg-paper-2 py-1.5 pl-4 pr-1.5">
        <input
          v-model="draft"
          placeholder="Tell Wren anything…"
          class="flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-muted"
          @keydown="handleKeydown"
        />
        <button
          class="rounded-pill bg-ink px-3.5 py-1.5 text-[12px] font-semibold text-paper transition-opacity disabled:opacity-40"
          :disabled="!draft.trim() || store.sending"
          @click="sendMessage"
        >
          SEND
        </button>
      </div>
    </div>
  </aside>
</template>
