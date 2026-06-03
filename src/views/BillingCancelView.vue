<template>
  <div>
    <!-- Heading -->
    <AppScreenHeading
      :eyebrow="t('billingCancel.eyebrow')"
      :title="t('billingCancel.title')"
      :emphasis="t('billingCancel.emphasis')"
    />

    <!-- Cancel card -->
    <div class="billing-cancel__card">
      <!-- Reassurance message -->
      <p class="billing-cancel__lede">
        {{ t('billingCancel.lede') }}
      </p>

      <!-- Action buttons -->
      <div class="billing-cancel__actions">
        <AppButton variant="primary" size="md" @click="goToSettings">
          {{ t('billingCancel.backToSettings') }}
        </AppButton>

        <AppButton variant="default" size="md" @click="goToToday">
          {{ t('billingCancel.backToToday') }}
        </AppButton>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppScreenHeading from '@/components/ui/AppScreenHeading.vue'
import AppButton from '@/components/ui/AppButton.vue'

/**
 * BillingCancelView — landing page Stripe Checkout redirects to on cancel.
 *
 * Stripe never charges the user when they bail out of Checkout — this view
 * just reassures them and routes back into the app. No state mutation
 * happens here; the User.subscription doc stays exactly as it was.
 */
export default {
  name: 'BillingCancelView',
  components: { AppScreenHeading, AppButton },
  setup() {
    // -- State --
    const { t } = useI18n()
    const router = useRouter()

    return {
      t,
      goToSettings,
      goToToday,
    }

    // -- Function definitions --

    /** Route back to the settings screen. */
    function goToSettings() {
      router.push({ name: 'settings' })
    }

    /** Route back to the Today screen. */
    function goToToday() {
      router.push({ name: 'today' })
    }
  }
}
</script>

<style lang="scss" scoped>
.billing-cancel {
  &__card {
    @apply rounded-2xl border border-rule-soft bg-paper-2 p-6 sm:p-8;
  }
  &__lede {
    @apply text-[16px] leading-relaxed text-ink;
  }
  &__actions {
    @apply mt-6 flex flex-wrap gap-3;
  }
}
</style>
