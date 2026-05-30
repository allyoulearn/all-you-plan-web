<template>
  <div
    class="wren-action-chip"
    :class="{ 'wren-action-chip--pending': pending && !done && !expired }"
  >
    <!-- AppIcon -->
    <CheckCircleIcon class="wren-action-chip__icon" aria-hidden="true" />

    <!-- Summary -->
    <span class="wren-action-chip__summary">
      {{ action.summary }}
    </span>

    <!-- Undo button -->
    <AppButton
      v-if="canUndo"
      variant="ghost"
      size="sm"
      class="wren-action-chip__undo"
      @click="onUndo"
    >
      {{ t('wren.actionUndo') }}
    </AppButton>

    <!-- Undone label -->
    <span v-else-if="done" class="wren-action-chip__resolution">
      {{ t('wren.actionUndone') }}
    </span>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { CheckCircleIcon } from '@heroicons/vue/24/outline'
import AppButton from '@/components/ui/AppButton.vue'

/**
 * WrenActionChip — renders an applied write action with an optional Undo
 * affordance.
 *
 * Responsibility:
 *   Visual representation of one WrenAppliedAction inside a coach bubble's
 *   actions row. Owns the local "this chip has been undone" and "this chip's
 *   undo window has expired" UI state — the parent only needs to wire the
 *   `undo` mutation in response to the emitted token.
 *
 * Props:
 *   - action (Object, required): { kind, summary, refType?, refId?,
 *     undoToken?, undoExpiresAt?, pending? }. `pending: true` (set
 *     client-side during WrenActionStarted) dims the chip until the matching
 *     WrenActionEvent arrives.
 *
 * Emits:
 *   - undo(undoToken): fired exactly once when the user taps Undo before the
 *     token expires. The chip immediately switches its label to "Undone" so
 *     a second tap is impossible — see onUndo for the one-shot guard.
 *
 * Lifetime / non-obvious behaviour:
 *   - If `undoExpiresAt` is already past at mount time, the Undo button is
 *     never shown (alreadyExpired computed).
 *   - Otherwise a setTimeout flips `expired` true when the window closes,
 *     reactively hiding the Undo button. The timer is cleared on
 *     beforeUnmount to avoid setting state on an unmounted instance.
 */
export default {
  name: 'WrenActionChip',
  components: { AppButton, CheckCircleIcon },
  props: {
    action: {
      type: Object,
      required: true
      // expected shape: { kind, summary, refType?, refId?, undoToken?, undoExpiresAt? }
    }
  },
  emits: ['undo'],
  setup(props, { emit }) {
    const { t } = useI18n()
    // -- State --
    const done = ref(false)
    const expired = ref(false)
    let expiryTimer = null

    // -- Computed --
    /** True while the action is in the pre-confirmation client-side state. */
    const pending = computed(() => Boolean(props.action.pending))

    /** True when the undo window was already past at mount time. */
    const alreadyExpired = computed(() => {
      if (!props.action.undoExpiresAt) return false
      return new Date(props.action.undoExpiresAt).getTime() <= Date.now()
    })

    /** True when the Undo button should currently be offered to the user. */
    const canUndo = computed(() =>
      Boolean(props.action.undoToken) && !done.value && !expired.value && !alreadyExpired.value
    )

    // -- Lifecycle --
    onMounted(() => {
      if (props.action.undoExpiresAt) {
        const ms = new Date(props.action.undoExpiresAt).getTime() - Date.now()

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
      done,
      expired,
      pending,
      alreadyExpired,
      canUndo,
      onUndo,
    }

    // -- Function definitions --

    /** Flip the chip to its "Undone" state and emit the undo token exactly once. */
    function onUndo() {
      done.value = true
      emit('undo', props.action.undoToken)
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
