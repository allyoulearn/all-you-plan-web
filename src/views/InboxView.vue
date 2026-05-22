<template>
  <div>
    <ScreenHeading
      eyebrow="Looking back · Inbox"
      title="Triage,"
      emphasis="don't think."
    />

    <div v-if="store.loading" class="inbox-view__status">
      Loading…
    </div>

    <div v-else-if="store.error" class="inbox-view__status inbox-view__status--error">
      {{ store.error }}
    </div>

    <!-- Capture card -->
    <Card>
      <p class="inbox-view__capture-label">
        Capture
      </p>

      <div class="inbox-view__capture-row">
        <input
          v-model="captureText"
          type="text"
          placeholder="What's on your mind?"
          class="inbox-view__capture-input"
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

    <div v-if="store.items.length === 0 && !store.loading" class="inbox-view__status">
      Nothing to triage. Capture something above.
    </div>

    <div v-else class="inbox-view__list">
      <div
        v-for="(item, idx) in store.items"
        :key="item.id"
        class="inbox-view__list-item"
      >
        <!-- Index -->
        <span class="inbox-view__index">
          {{ String(idx + 1).padStart(2, '0') }}
        </span>

        <!-- Content -->
        <div class="inbox-view__content">
          <span class="inbox-view__text">
            {{ item.text }}
          </span>

          <span class="inbox-view__meta">
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

<script>
/** InboxView — quick-capture panel with a running triage list. */
import { onMounted, ref } from 'vue'
import { useInboxStore } from '@/stores/inbox.store.js'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

export default {
  name: 'InboxView',
  components: { ScreenHeading, SectionHeader, Button, Card },
  setup() {
    // -- State --
    const store = useInboxStore()
    const captureText = ref('')
    const capturing = ref(false)

    // -- Lifecycle --
    onMounted(() => store.load())

    // -- Function definitions --

    /** Submits the current capture text to the store and clears the input. */
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

    /**
     * Formats a date string as a human-readable relative time.
     * @param {string} dateStr
     * @returns {string}
     */
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

    return { store, captureText, capturing, capture, relativeTime }
  }
}
</script>

<style lang="scss" scoped>
.inbox-view {
  &__status {
    @apply text-[13px] text-muted;

    &--error {
      @apply text-bad;
    }
  }

  &__capture-label {
    @apply font-mono text-[10px] uppercase tracking-[0.12em] text-muted;
  }

  &__capture-row {
    @apply flex gap-2.5;
  }

  &__capture-input {
    @apply flex-1 rounded-sm border border-rule-soft bg-paper px-3 py-2 text-[14px] text-ink placeholder:text-muted outline-none focus:border-muted;
    @apply dark:bg-paper;
  }

  &__list {
    @apply rounded-md bg-paper-2 px-2.5 py-1 shadow-sm;
  }

  &__list-item {
    @apply flex items-center gap-4 border-b border-rule-soft py-3.5 last:border-0;
  }

  &__index {
    @apply w-6 shrink-0 font-mono text-[12px] text-muted;
  }

  &__content {
    @apply flex flex-1 flex-col gap-0.5 min-w-0;
  }

  &__text {
    @apply truncate text-[14px] text-ink;
  }

  &__meta {
    @apply font-mono text-[11px] text-muted;
  }
}
</style>
