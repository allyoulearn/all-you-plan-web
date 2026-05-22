<script setup>
import { ref, computed } from 'vue'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import WrenBubble from '@/components/wren/WrenBubble.vue'
import { useWrenChat, QUICK_PROMPTS } from '@/composables/useWrenChat'

const bodyRef = ref(null)
const { store, draft, sendMessage, handleKeydown, fillFromChip } = useWrenChat(bodyRef)

const today = computed(() =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
)
</script>

<template>
  <div class="flex h-full flex-col">
    <ScreenHeading eyebrow="With Wren · Chat" title="A longer" emphasis="conversation." />

    <!-- Date divider -->
    <div class="mb-5 flex items-center justify-center">
      <span class="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{{ today }}</span>
    </div>

    <!-- Messages area -->
    <div ref="bodyRef" class="mx-auto flex w-full max-w-[820px] flex-1 flex-col gap-4 overflow-y-auto pb-4">
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
        <p class="text-[13px] text-muted">Start a conversation with Wren.</p>
      </div>
    </div>

    <!-- Quick-prompt chips -->
    <div class="mx-auto mt-4 flex w-full max-w-[820px] flex-wrap gap-2">
      <button
        v-for="prompt in QUICK_PROMPTS"
        :key="prompt"
        class="rounded-pill border border-rule-soft bg-paper-2 px-3 py-1 text-[11px] text-muted transition-colors hover:bg-paper-3 hover:text-ink"
        @click="fillFromChip(prompt)"
      >
        {{ prompt }}
      </button>
    </div>

    <!-- Input bar -->
    <div class="mx-auto mt-3 w-full max-w-[820px] pb-4">
      <div class="flex items-center gap-2 rounded-pill border border-rule-soft bg-paper-2 py-1.5 pl-4 pr-1.5 focus-within:border-muted">
        <input
          v-model="draft"
          placeholder="Tell Wren anything…"
          class="flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-muted"
          @keydown="handleKeydown"
        />
        <button
          class="rounded-pill bg-ink px-3.5 py-1.5 text-[12px] font-semibold text-paper transition-opacity disabled:opacity-40"
          :disabled="!draft.trim() || store.sending"
          aria-label="Send message"
          @click="sendMessage"
        >
          SEND
        </button>
      </div>
    </div>
  </div>
</template>
