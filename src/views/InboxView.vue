<script setup>
import { onMounted, ref } from 'vue'
import { useInboxStore } from '@/stores/inbox.store'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

const store = useInboxStore()
onMounted(() => store.load())

const captureText = ref('')
const capturing = ref(false)

async function capture() {
  if (!captureText.value.trim()) return
  capturing.value = true
  try {
    await store.capture(captureText.value.trim())
    captureText.value = ''
  } finally {
    capturing.value = false
  }
}

function relativeTime(dateStr) {
  if (!dateStr) return ''
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  return `${diffDays}d ago`
}
</script>

<template>
  <div>
    <ScreenHeading
      eyebrow="Looking back · Inbox"
      title="Triage,"
      emphasis="don't think."
    />

    <div v-if="store.loading" class="text-[13px] text-muted">Loading…</div>
    <div v-else-if="store.error" class="text-[13px] text-bad">{{ store.error }}</div>

    <!-- Capture card -->
    <Card>
      <p class="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
        Capture
      </p>
      <div class="flex gap-2.5">
        <input
          v-model="captureText"
          type="text"
          placeholder="What's on your mind?"
          class="flex-1 rounded-sm border border-rule-soft bg-paper px-3 py-2 text-[14px] text-ink placeholder-muted outline-none focus:border-muted dark:bg-paper"
          @keydown.enter="capture"
        />
        <Button
          variant="primary"
          :disabled="!captureText.trim() || capturing"
          @click="capture"
        >
          Capture
        </Button>
      </div>
    </Card>

    <!-- To triage list -->
    <SectionHeader label="To triage" :count="store.items.length" />

    <div v-if="store.items.length === 0 && !store.loading" class="text-[13px] text-muted">
      Nothing to triage. Capture something above.
    </div>

    <div v-else class="rounded-md bg-paper-2 px-2.5 py-1 shadow-sm">
      <div
        v-for="(item, idx) in store.items"
        :key="item.id"
        class="flex items-center gap-4 border-b border-rule-soft py-3.5 last:border-0"
      >
        <!-- Index -->
        <span class="w-6 shrink-0 font-mono text-[12px] text-muted">
          {{ String(idx + 1).padStart(2, '0') }}
        </span>

        <!-- Content -->
        <div class="flex flex-1 flex-col gap-0.5 min-w-0">
          <span class="truncate text-[14px] text-ink">{{ item.text }}</span>
          <span class="font-mono text-[11px] text-muted">
            {{ item.source }} · {{ relativeTime(item.capturedAt) }}
          </span>
        </div>

        <!-- Triage action -->
        <Button size="sm" variant="ghost" @click="store.triage(item.id)">
          Triage
        </Button>
      </div>
    </div>
  </div>
</template>
