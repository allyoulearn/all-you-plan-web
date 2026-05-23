<template>
  <!-- User bubble: right-aligned on paper-3 -->
  <div v-if="message.sender === 'user'" class="wren-bubble wren-bubble--user">
    <div class="wren-bubble__inner">
      <p class="wren-bubble__timestamp wren-bubble__timestamp--right">
        {{ formatWhen(message.createdAt) }}
      </p>

      <div class="wren-bubble__body wren-bubble__body--user">
        {{ message.text }}
      </div>
    </div>
  </div>

  <!-- Coach bubble: left-aligned, accent when actions present -->
  <div v-else class="wren-bubble wren-bubble--coach">
    <div class="wren-bubble__inner">
      <p class="wren-bubble__timestamp">
        {{ formatWhen(message.createdAt) }}
      </p>

      <div
        class="wren-bubble__body"
        :class="message.actions && message.actions.length
          ? 'wren-bubble__body--accent'
          : 'wren-bubble__body--default'"
      >
        {{ message.text }}
      </div>

      <div v-if="message.actions && message.actions.length" class="wren-bubble__actions">
        <Button
          v-for="(action, idx) in message.actions"
          :key="`${message.id}-${idx}`"
          variant="ghost"
          size="sm"
          class="wren-bubble__action-btn"
          @click="$emit('action', action)"
        >
          {{ action }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script>
/** WrenBubble — chat message bubble for the Wren coach interface, supporting user and coach orientations. */
import Button from '@/components/ui/Button.vue'

export default {
  name: 'WrenBubble',
  components: { Button },
  props: {
    /** The message object with sender, text, actions, and createdAt fields */
    message: { type: Object, required: true }
  },
  emits: ['action'],
  setup() {
    // -- Function definitions --

    /**
     * Formats an ISO timestamp to a short locale time string.
     * @param {string|null} iso - ISO 8601 date string or null
     * @returns {string}
     */
    function formatWhen(iso) {
      if (!iso) return ''
      const d = new Date(iso)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    return { formatWhen }
  }
}
</script>

<style lang="scss" scoped>
.wren-bubble {
  &--user {
    @apply flex justify-end;
  }

  &--coach {
    @apply flex justify-start;
  }

  &__inner {
    @apply max-w-[75%];
  }

  &--coach &__inner {
    max-width: 80%;
  }

  &__timestamp {
    @apply mb-1 font-mono text-[10px] tracking-wide text-muted;

    &--right {
      @apply text-right;
    }
  }

  &__body {
    @apply rounded-tl-xl rounded-tr-xl px-4 py-3 text-[14px] leading-relaxed;

    &--user {
      @apply rounded-bl-xl rounded-br-sm bg-paper-3 text-ink;
    }

    &--default {
      @apply rounded-br-xl rounded-bl-sm bg-paper-2 text-ink;
    }

    &--accent {
      @apply rounded-br-xl rounded-bl-sm bg-accent text-accent-ink shadow-accent-glow;
    }
  }

  &__actions {
    @apply mt-2 flex flex-wrap gap-2;
  }

  // Clamp long action labels so a very-long action text can't overflow the
  // bubble's max-width (WEB-W3-20).
  &__action-btn {
    @apply max-w-full truncate;
  }
}
</style>
