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
        :class="hasActions ? 'wren-bubble__body--accent' : 'wren-bubble__body--default'"
      >
        {{ message.text
        }}<span
          v-if="message.status === 'streaming'"
          class="wren-bubble__cursor"
          aria-hidden="true"
        >
          ▊
        </span>

        <span
          v-else-if="message.status === 'interrupted'"
          class="wren-bubble__interrupted"
        >
          · stream interrupted
        </span>
      </div>

      <div v-if="hasActions" class="wren-bubble__actions">
        <template v-for="(action, idx) in normalizedActions" :key="`${message.id}-${idx}`">
          <Button
            v-if="action.kind === 'suggested'"
            variant="ghost"
            size="sm"
            class="wren-bubble__action-btn"
            @click="$emit('action', action.label)"
          >
            {{ action.label }}
          </Button>

          <WrenActionChip
            v-else-if="action.kind === 'applied'"
            :action="action.payload"
            @undo="token => $emit('undo', token)"
          />

          <WrenConfirmChip
            v-else-if="action.kind === 'pending'"
            :pending="action.payload"
            @confirm="token => $emit('confirm', token)"
            @cancel="token => $emit('cancel', token)"
          />

          <WrenUpgradeChip
            v-else-if="action.kind === 'upgrade'"
            :action="action.payload"
            @upgrade="planId => $emit('upgrade', planId)"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * WrenBubble — chat message bubble for the Wren coach interface.
 *
 * Supports the new actions union (WrenSuggestedAction | WrenAppliedAction |
 * WrenPendingConfirmation) AND legacy plain-string actions for backwards
 * compatibility with the scripted-matcher path.
 */
import Button from '@/components/ui/Button.vue'
import WrenActionChip from '@/components/wren/WrenActionChip.vue'
import WrenConfirmChip from '@/components/wren/WrenConfirmChip.vue'
import WrenUpgradeChip from '@/components/wren/WrenUpgradeChip.vue'

/**
 * Classify a raw action entry into a normalised shape consumed by the template.
 * @param {string|object|null} raw
 * @returns {{ kind: 'suggested', label: string } | { kind: 'applied'|'pending'|'upgrade', payload: object } | null}
 */
function classify(raw) {
  if (typeof raw === 'string') return { kind: 'suggested', label: raw }
  if (!raw || typeof raw !== 'object') return null
  // Upgrade CTA from the cap-hit branch of sendWrenMessage. Surface this
  // BEFORE the generic `summary` check so an upgrade payload (which also has
  // a summary string) is routed to WrenUpgradeChip rather than the applied
  // action chip. The structural marker is the explicit `kind: 'upgrade'`.
  if (raw.kind === 'upgrade' || raw.__typename === 'WrenUpgradeAction') {
    return { kind: 'upgrade', payload: raw }
  }
  if (raw.__typename === 'WrenSuggestedAction' || typeof raw.label === 'string') {
    return { kind: 'suggested', label: raw.label }
  }
  if (raw.__typename === 'WrenPendingConfirmation' || raw.confirmToken) {
    return { kind: 'pending', payload: raw }
  }
  if (raw.__typename === 'WrenAppliedAction' || raw.summary) {
    return { kind: 'applied', payload: raw }
  }
  return null
}

export default {
  name: 'WrenBubble',
  components: { Button, WrenActionChip, WrenConfirmChip, WrenUpgradeChip },
  props: {
    /** The message object with sender, text, actions, status, and createdAt fields */
    message: { type: Object, required: true }
  },
  emits: ['action', 'undo', 'confirm', 'cancel', 'upgrade'],
  computed: {
    normalizedActions() {
      if (!Array.isArray(this.message.actions)) return []
      return this.message.actions.map(classify).filter(Boolean)
    },
    hasActions() {
      return this.normalizedActions.length > 0
    }
  },
  methods: {
    /**
     * Formats an ISO timestamp to a short locale time string.
     * @param {string|null} iso - ISO 8601 date string or null
     * @returns {string}
     */
    formatWhen(iso) {
      if (!iso) return ''
      try {
        const d = new Date(iso)
        if (Number.isNaN(d.getTime())) return ''
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      } catch {
        return ''
      }
    }
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

  &__cursor {
    display: inline-block;
    margin-left: 1px;
    animation: wren-bubble-cursor-blink 1s steps(2, start) infinite;
  }

  // Inline indicator appended when the watchdog flips a streaming message to
  // 'interrupted'. Same line as the partial text so the partial reply isn't
  // pushed offscreen — the muted style communicates "this is metadata".
  &__interrupted {
    @apply ml-2 font-mono text-[11px] uppercase tracking-wider text-muted;
  }
}

@keyframes wren-bubble-cursor-blink {
  to {
    visibility: hidden;
  }
}
</style>
