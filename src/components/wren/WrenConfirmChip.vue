<template>
  <div class="wren-confirm-chip" :class="{ 'wren-confirm-chip--resolved': resolved }">
    <ExclamationTriangleIcon class="wren-confirm-chip__icon" aria-hidden="true" />

    <span class="wren-confirm-chip__summary">
      {{ pending.summary }}
    </span>

    <template v-if="resolved">
      <span class="wren-confirm-chip__resolution">
        {{ resolved }}
      </span>
    </template>

    <template v-else>
      <Button
        variant="ghost"
        size="sm"
        class="wren-confirm-chip__btn"
        @click="onCancel"
      >
        Cancel
      </Button>

      <Button
        variant="primary"
        size="sm"
        class="wren-confirm-chip__btn"
        @click="onConfirm"
      >
        Confirm
      </Button>
    </template>
  </div>
</template>

<script>
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import Button from '@/components/ui/Button.vue'

/**
 * WrenConfirmChip — renders a pending destructive action awaiting user
 * confirmation.
 *
 * Responsibility:
 *   Visual representation of one WrenPendingConfirmation inside a coach
 *   bubble's actions row. Owns the local "resolved" UI state so the chip
 *   immediately switches from buttons to a label after the user picks one,
 *   preventing double-submit while the API mutation is in flight.
 *
 * Props:
 *   - pending (Object, required): { confirmToken, tool, summary, refType,
 *     refId, expiresAt }.
 *
 * Emits:
 *   - confirm(confirmToken): fired once when the user taps Confirm.
 *   - cancel(confirmToken): fired once when the user taps Cancel.
 *
 * Non-obvious behaviour:
 *   - The chip does not track `expiresAt` itself. If the API rejects a
 *     stale token, the parent (wren store) should surface the error via
 *     toastError; the visual chip will simply read "Confirmed/Cancelled"
 *     locally even though the action failed server-side. A future revision
 *     could mirror WrenActionChip's expiry timer to disable the buttons
 *     once `expiresAt` passes.
 */
export default {
  name: 'WrenConfirmChip',
  components: { Button, ExclamationTriangleIcon },
  props: {
    pending: {
      type: Object,
      required: true
      // expected shape: { confirmToken, tool, summary, refType, refId, expiresAt }
    }
  },
  emits: ['confirm', 'cancel'],
  data() {
    return { resolved: null }
  },
  methods: {
    onConfirm() {
      this.resolved = 'Confirmed'
      this.$emit('confirm', this.pending.confirmToken)
    },
    onCancel() {
      this.resolved = 'Cancelled'
      this.$emit('cancel', this.pending.confirmToken)
    }
  }
}
</script>

<style scoped>
.wren-confirm-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
  background: var(--paper-3, #fff8e0);
  border: 1px solid var(--amber-3, #ddc070);
  font-size: 0.875rem;
}
.wren-confirm-chip--resolved {
  opacity: 0.7;
}
.wren-confirm-chip__icon {
  width: 1rem;
  height: 1rem;
  color: var(--amber-6, #b87f00);
}
.wren-confirm-chip__resolution {
  font-size: 0.75rem;
  color: var(--ink-3, #888);
}
</style>
