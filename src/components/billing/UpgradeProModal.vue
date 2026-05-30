<template>
  <AppModal :model-value="modelValue" :title="t('upgradeModal.title')" @update:model-value="onClose">
    <div class="upgrade-modal">
      <p class="upgrade-modal__lede">
        {{ t('upgradeModal.lede') }}
      </p>

      <!-- Benefits list -->
      <ul class="upgrade-modal__benefits">
        <li v-for="b in benefits" :key="b.label" class="upgrade-modal__benefit">
          <SparklesIcon class="upgrade-modal__benefit-icon" aria-hidden="true" />

          <span class="upgrade-modal__benefit-text">
            {{ b.label }}
          </span>
        </li>
      </ul>

      <!-- Billing cadence toggle -->
      <div class="upgrade-modal__cadence">
        <span class="upgrade-modal__cadence-label">
          {{ t('upgradeModal.billingCadenceLabel') }}
        </span>

        <AppSegmentedControl
          :model-value="cadence"
          :options="cadenceOptions"
          :group-label="t('upgradeModal.billingCadenceLabel')"
          @update:model-value="onCadenceChange"
        />
      </div>

      <!-- Price block -->
      <div class="upgrade-modal__price-block">
        <span class="upgrade-modal__price">
          {{ activePrice.amount }}
        </span>

        <span class="upgrade-modal__price-unit">
          {{ activePrice.unit }}
        </span>

        <span v-if="activePrice.note" class="upgrade-modal__price-note">
          {{ activePrice.note }}
        </span>
      </div>
    </div>

    <template #footer>
      <AppButton variant="ghost" :disabled="submitting" @click="onClose">
        {{ t('upgradeModal.cancel') }}
      </AppButton>

      <AppButton variant="primary" :disabled="submitting" @click="onContinue">
        <SparklesIcon class="upgrade-modal__cta-icon" aria-hidden="true" />
        {{ submitting ? t('upgradeModal.continuing') : t('upgradeModal.continue') }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { SparklesIcon } from '@heroicons/vue/24/outline'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSegmentedControl from '@/components/ui/AppSegmentedControl.vue'
import { useBilling } from '@/composables/useBilling.js'

/**
 * UpgradeProModal — modal entry point for the Stripe upgrade flow.
 * Replaces the previous direct-redirect button. Lets the user choose between
 * monthly and yearly billing cadence before bouncing to Stripe Checkout.
 *
 * Acts as a thin wrapper around useBilling().startUpgrade — billing logic and
 * error toasts live in the composable; this component only collects the
 * cadence choice and surfaces a submitting state.
 */
export default {
  name: 'UpgradeProModal',
  components: { AppModal, AppButton, AppSegmentedControl, SparklesIcon },
  props: {
    /** Open/close state (v-model) */
    modelValue: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const billing = useBilling()

    const cadence = ref('pro_monthly')
    const submitting = ref(false)

    const benefits = computed(() => [
      { label: t('upgradeModal.benefitWren') },
      { label: t('upgradeModal.benefitCalendar') },
      { label: t('upgradeModal.benefitFuture') },
      { label: t('upgradeModal.benefitSupport') }
    ])

    const cadenceOptions = computed(() => [
      { value: 'pro_monthly', label: t('upgradeModal.cadenceMonthly') },
      { value: 'pro_yearly', label: t('upgradeModal.cadenceYearly') }
    ])

    const activePrice = computed(() => {
      if (cadence.value === 'pro_yearly') {
        return {
          amount: t('upgradeModal.priceYearlyAmount'),
          unit: t('upgradeModal.priceYearlyUnit'),
          note: t('upgradeModal.priceYearlyNote')
        }
      }

      return {
        amount: t('upgradeModal.priceMonthlyAmount'),
        unit: t('upgradeModal.priceMonthlyUnit'),
        note: ''
      }
    })

    return { t, cadence, cadenceOptions, benefits, activePrice, submitting, onCadenceChange, onContinue, onClose }

    function onCadenceChange(val) {
      cadence.value = val
    }

    async function onContinue() {
      if (submitting.value) return
      submitting.value = true

      try {
        // billing.startUpgrade redirects to Stripe on success — the modal
        // stays open behind the redirect so users see a continuing state
        // until the browser navigates away. On failure (toasted upstream)
        // we re-enable the buttons.
        const result = await billing.startUpgrade(cadence.value)
        if (!result?.ok) submitting.value = false
      } catch {
        submitting.value = false
      }
    }

    function onClose() {
      if (submitting.value) return
      emit('update:modelValue', false)
    }
  }
}
</script>

<style lang="scss" scoped>
.upgrade-modal {
  @apply flex flex-col gap-4;

  &__lede {
    @apply m-0 text-[14px] leading-snug;
    color: var(--ink-2);
  }

  &__benefits {
    @apply m-0 flex list-none flex-col gap-2 p-0;
  }
  &__benefit {
    @apply flex items-start gap-2.5;
  }
  &__benefit-icon {
    @apply mt-0.5 h-4 w-4 shrink-0;
    color: var(--accent);
  }
  &__benefit-text {
    @apply text-[14px] leading-snug;
  }

  &__cadence {
    @apply mt-1 flex items-center justify-between gap-3 rounded-md px-3 py-2;
    background: var(--paper-2);
  }
  &__cadence-label {
    @apply font-mono uppercase;
    color: var(--muted);
    font-size: 10px;
    letter-spacing: 0.14em;
  }

  &__price-block {
    @apply flex items-baseline gap-2;
  }
  &__price {
    @apply font-serif text-[32px] leading-none;
    color: var(--ink);
  }
  &__price-unit {
    @apply text-[13px];
    color: var(--muted);
  }
  &__price-note {
    @apply ml-1 rounded-pill px-2 py-0.5 text-[11px] font-medium;
    background: color-mix(in oklab, var(--accent) 12%, var(--paper));
    color: var(--accent);
  }

  &__cta-icon {
    @apply h-4 w-4;
  }
}
</style>
