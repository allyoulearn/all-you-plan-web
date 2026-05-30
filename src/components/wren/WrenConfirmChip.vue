<template>
  <div
    class="wren-confirm-chip"
    :class="{
      'wren-confirm-chip--resolved': resolved,
      'wren-confirm-chip--expired': isExpired && !resolved
    }"
  >
    <!-- Warning icon -->
    <ExclamationTriangleIcon class="wren-confirm-chip__icon" aria-hidden="true" />

    <!-- Summary -->
    <span class="wren-confirm-chip__summary">
      {{ pending.summary }}
    </span>

    <!-- Resolved label -->
    <template v-if="resolved">
      <span class="wren-confirm-chip__resolution">
        {{ resolved }}
      </span>
    </template>

    <!-- Expired label -->
    <template v-else-if="isExpired">
      <span class="wren-confirm-chip__resolution">
        {{ t('wren.confirmExpired') }}
      </span>
    </template>

    <!-- Action buttons -->
    <template v-else>
      <!-- Cancel button -->
      <AppButton
        variant="ghost"
        size="sm"
        class="wren-confirm-chip__btn"
        @click="onCancel"
      >
        {{ t('common.cancel') }}
      </AppButton>

      <!-- Confirm button -->
      <AppButton
        variant="primary"
        size="sm"
        class="wren-confirm-chip__btn"
        @click="onConfirm"
      >
        {{ t('wren.confirmAccept') }}
      </AppButton>
    </template>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import AppButton from '@/components/ui/AppButton.vue'

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
 *   - Mirrors WrenActionChip's expiry pattern: when `expiresAt` is already
 *     past at mount, the buttons are replaced with an "Expired" label. When
 *     it lapses while the chip is mounted, a setTimeout flips `expired` true
 *     and the buttons disappear. The timer is cleared on beforeUnmount.
 *     The API also rejects stale tokens, so this is purely a UX guard so the
 *     user does not click a button that will surface a toast error.
 */
export default {
  name: 'WrenConfirmChip',
  components: { AppButton, ExclamationTriangleIcon },
  props: {
    pending: {
      type: Object,
      required: true
      // expected shape: { confirmToken, tool, summary, refType, refId, expiresAt }
    }
  },
  emits: ['confirm', 'cancel'],
  setup(props, { emit }) {
    const { t } = useI18n()
    // -- State --
    const resolved = ref(null)
    const expired = ref(false)
    let expiryTimer = null

    // -- Computed --
    /** True when the confirmation window was already past at mount time. */
    const alreadyExpired = computed(() => {
      if (!props.pending.expiresAt) return false
      return new Date(props.pending.expiresAt).getTime() <= Date.now()
    })

    /** True when the confirmation window has elapsed (either at mount or while mounted). */
    const isExpired = computed(() => expired.value || alreadyExpired.value)

    // -- Lifecycle --
    onMounted(() => {
      if (props.pending.expiresAt) {
        const ms = new Date(props.pending.expiresAt).getTime() - Date.now()

        if (ms > 0) {
          expiryTimer = setTimeout(() => {
            expired.value = true
          }, ms)
        } else {
          expired.value = true
        }
      }
    })

    onBeforeUnmount(() => {
      if (expiryTimer) clearTimeout(expiryTimer)
    })

    return {
      t,
      resolved,
      expired,
      alreadyExpired,
      isExpired,
      onConfirm,
      onCancel,
    }

    // -- Function definitions --

    /** Flip the chip to Confirmed and emit the confirm token (once, non-expired). */
    function onConfirm() {
      if (isExpired.value) return
      resolved.value = t('wren.confirmResolved')
      emit('confirm', props.pending.confirmToken)
    }

    /** Flip the chip to Cancelled and emit the cancel token (once, non-expired). */
    function onCancel() {
      if (isExpired.value) return
      resolved.value = t('wren.cancelResolved')
      emit('cancel', props.pending.confirmToken)
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
.wren-confirm-chip--expired {
  opacity: 0.5;
  background: var(--paper-2, #f7f6f1);
  border-color: var(--rule-soft, #e0ddd2);
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
