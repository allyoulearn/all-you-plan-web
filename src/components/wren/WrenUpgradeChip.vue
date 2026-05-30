<template>
  <div class="wren-upgrade-chip">
    <!-- AppIcon -->
    <SparklesIcon class="wren-upgrade-chip__icon" aria-hidden="true" />

    <!-- Summary -->
    <span class="wren-upgrade-chip__summary">
      {{ action.summary || 'Upgrade to Pro' }}
    </span>

    <!-- Upgrade CTA -->
    <AppButton
      variant="primary"
      size="sm"
      class="wren-upgrade-chip__btn"
      @click="onUpgrade"
    >
      Upgrade to Pro
      <ArrowUpRightIcon class="wren-upgrade-chip__btn-icon" aria-hidden="true" />
    </AppButton>
  </div>
</template>

<script>
import { SparklesIcon, ArrowUpRightIcon } from '@heroicons/vue/24/outline'
import AppButton from '@/components/ui/AppButton.vue'
import { useBilling } from '@/composables/useBilling.js'

/**
 * WrenUpgradeChip — CTA rendered inside a coach bubble when the daily Wren
 * turn cap is hit. The backend emits the upgrade action only for Free users
 * (Pro/Family have already converted), so this chip never appears for paying
 * users — it represents the highest-intent moment in the conversion funnel.
 *
 * Props:
 *   - action (Object, required): { kind: 'upgrade', summary, planId }. Shape
 *     matches the backend payload from src/domains/wren/resolvers.ts cap-hit
 *     branch.
 *
 * Emits:
 *   - upgrade(planId): bubbles up the planId so a parent can intercept and
 *     dispatch a custom checkout flow if needed. By default the chip also
 *     calls useBilling().startUpgrade(planId) which runs the
 *     createCheckoutSession GraphQL mutation and redirects to the hosted
 *     Stripe Checkout URL.
 */
export default {
  name: 'WrenUpgradeChip',
  components: { AppButton, SparklesIcon, ArrowUpRightIcon },
  props: {
    action: {
      type: Object,
      required: true
      // expected shape: { kind: 'upgrade', summary, planId }
    }
  },
  emits: ['upgrade'],
  setup(props, { emit }) {
    return { onUpgrade }

    // -- Function definitions --

    /**
     * Emit `upgrade` with the resolved planId, then fire-and-forget the
     * billing composable so the CTA still works when no parent intercepts.
     */
    function onUpgrade() {
      const planId = props.action.planId || 'wren-pro'
      emit('upgrade', planId)

      // Default behaviour: invoke the billing composable so the CTA does
      // something even when no parent intercepts the event. startUpgrade is
      // async but we deliberately don't await it — the redirect happens
      // inside the composable and any error surfaces as a toast.
      try {
        // Catch any rejection so the click handler never reports an
        // unhandled promise to the console.
        useBilling().startUpgrade(planId).catch(() => {
          /* startUpgrade surfaces its own toast on error */
        })
      } catch {
        // Composable can throw in test envs without Pinia / app context;
        // the emitted event is sufficient for tests.
      }
    }
  }
}
</script>

<style scoped>
.wren-upgrade-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.625rem;
  border-radius: 0.5rem;
  background: var(--paper-3, #fff8e0);
  border: 1px solid var(--accent, #b87f00);
  font-size: 0.875rem;
}
.wren-upgrade-chip__icon {
  width: 1rem;
  height: 1rem;
  color: var(--accent, #b87f00);
}
.wren-upgrade-chip__summary {
  line-height: 1.2;
}
.wren-upgrade-chip__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
.wren-upgrade-chip__btn-icon {
  width: 0.875rem;
  height: 0.875rem;
}
</style>
