<template>
  <div
    class="wren-action-chip"
    :class="{ 'wren-action-chip--pending': pending && !done && !expired }"
  >
    <CheckCircleIcon class="wren-action-chip__icon" aria-hidden="true" />

    <span class="wren-action-chip__summary">
      {{ action.summary }}
    </span>

    <Button
      v-if="canUndo"
      variant="ghost"
      size="sm"
      class="wren-action-chip__undo"
      @click="onUndo"
    >
      Undo
    </Button>

    <span v-else-if="done" class="wren-action-chip__resolution">
      Undone
    </span>
  </div>
</template>

<script>
import { CheckCircleIcon } from '@heroicons/vue/24/outline'
import Button from '@/components/ui/Button.vue'

/**
 * WrenActionChip — renders an applied write action with an optional Undo affordance.
 * The Undo button disappears once tapped (one-shot) or after `undoExpiresAt` passes.
 */
export default {
  name: 'WrenActionChip',
  components: { Button, CheckCircleIcon },
  props: {
    action: {
      type: Object,
      required: true
      // expected shape: { kind, summary, refType?, refId?, undoToken?, undoExpiresAt? }
    }
  },
  emits: ['undo'],
  data() {
    return { done: false, expired: false, expiryTimer: null }
  },
  computed: {
    pending() {
      return Boolean(this.action.pending)
    },
    alreadyExpired() {
      if (!this.action.undoExpiresAt) return false
      return new Date(this.action.undoExpiresAt).getTime() <= Date.now()
    },
    canUndo() {
      return (
        Boolean(this.action.undoToken) && !this.done && !this.expired && !this.alreadyExpired
      )
    }
  },
  mounted() {
    if (this.action.undoExpiresAt) {
      const ms = new Date(this.action.undoExpiresAt).getTime() - Date.now()
      if (ms > 0) {
        this.expiryTimer = setTimeout(() => {
          this.expired = true
        }, ms)
      } else {
        this.expired = true
      }
    }
  },
  beforeUnmount() {
    if (this.expiryTimer) clearTimeout(this.expiryTimer)
  },
  methods: {
    onUndo() {
      this.done = true
      this.$emit('undo', this.action.undoToken)
    }
  }
}
</script>

<style scoped>
.wren-action-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
  background: var(--paper-2, #f7f6f1);
  font-size: 0.875rem;
}
.wren-action-chip--pending {
  opacity: 0.6;
}
.wren-action-chip__icon {
  width: 1rem;
  height: 1rem;
}
.wren-action-chip__summary {
  line-height: 1.2;
}
.wren-action-chip__resolution {
  font-size: 0.75rem;
  color: var(--ink-3, #888);
}
</style>
