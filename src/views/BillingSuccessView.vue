<template>
  <div>
    <!-- Heading -->
    <AppScreenHeading
      :eyebrow="t('billingSuccess.eyebrow')"
      :title="t('billingSuccess.title')"
      :emphasis="t('billingSuccess.emphasis')"
    />

    <!-- Confirmation card -->
    <div class="billing-success__card">
      <!-- Confirming state -->
      <p v-if="confirming" class="billing-success__status">
        {{ t('billingSuccess.confirming') }}
      </p>

      <!-- Paid state -->
      <template v-else-if="isPaid">
        <!-- Tier confirmation -->
        <p class="billing-success__lede">
          {{ t('billingSuccess.ledePrefix') }} <strong>
            {{ tierLabel }}
          </strong> {{ t('billingSuccess.ledeSuffix') }}
        </p>

        <!-- Next billing date -->
        <p v-if="nextBillingLabel" class="billing-success__next">
          {{ t('billingSuccess.nextBilling', { date: nextBillingLabel }) }}
        </p>

        <!-- Action buttons -->
        <div class="billing-success__actions">
          <AppButton variant="primary" size="md" @click="goToToday">
            {{ t('billingSuccess.backToToday') }}
            <ArrowRightIcon class="billing-success__icon" aria-hidden="true" />
          </AppButton>

          <AppButton variant="default" size="md" @click="goToSettings">
            {{ t('billingSuccess.manageSubscription') }}
          </AppButton>
        </div>
      </template>

      <!-- Pending fallback -->
      <template v-else>
        <!-- Session reference -->
        <p class="billing-success__status">
          {{ t('billingSuccess.pendingPrefix') }}
          <code class="billing-success__code">
            {{ sessionId || t('billingSuccess.sessionUnknown') }}
          </code>.
        </p>

        <!-- Action button -->
        <div class="billing-success__actions">
          <AppButton variant="default" size="md" @click="goToSettings">
            {{ t('billingSuccess.openSettings') }}
          </AppButton>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowRightIcon } from '@heroicons/vue/24/outline'
import AppScreenHeading from '@/components/ui/AppScreenHeading.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useAuthStore } from '@/stores/auth.store.js'

const POLL_INTERVAL_MS = 1500
const POLL_MAX_ATTEMPTS = 8

/**
 * BillingSuccessView — landing page Stripe Checkout redirects to on success.
 *
 * The webhook (POST /webhooks/stripe → customer.subscription.created) writes
 * the new tier asynchronously, so the user can arrive here before their User
 * doc has been updated. We poll the `me` query for up to ~12s, refresh the
 * persisted auth store on each tick, and stop as soon as
 * `subscription.tier !== 'free'`.
 *
 * If the poll runs out (Stripe latency or webhook misconfiguration) we still
 * show a graceful "payment received" message so the user is not stuck on a
 * blank screen — the session id is surfaced for support reference.
 */
export default {
  name: 'BillingSuccessView',
  components: { ArrowRightIcon, AppScreenHeading, AppButton },
  setup() {
    // -- State --
    const { t } = useI18n()
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()

    const confirming = ref(true)
    const sessionId = ref('')
    const pollTimer = ref(null)
    const pollAttempts = ref(0)

    // -- Computed --
    const user = computed(() => authStore.user)

    const tier = computed(() => {
      const value = user.value?.subscription?.tier
      return value === 'pro' || value === 'family' ? value : 'free'
    })

    const isPaid = computed(() => tier.value !== 'free')

    const tierLabel = computed(() =>
      tier.value === 'family' ? t('billingSuccess.tierFamily') : t('billingSuccess.tierPro')
    )

    const nextBillingLabel = computed(() => {
      const iso = user.value?.subscription?.currentPeriodEnd
      if (!iso) return ''
      const date = new Date(iso)
      if (Number.isNaN(date.getTime())) return ''
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    })

    // -- Lifecycle --
    onMounted(() => {
      sessionId.value = String(route.query.session_id || '')

      if (isPaid.value) {
        confirming.value = false
        return
      }

      pollMe()
    })

    onBeforeUnmount(() => {
      if (pollTimer.value) {
        clearTimeout(pollTimer.value)
        pollTimer.value = null
      }
    })

    return {
      t,
      confirming,
      sessionId,
      isPaid,
      tierLabel,
      nextBillingLabel,
      goToToday,
      goToSettings,
    }

    // -- Function definitions --

    /**
     * Poll the `me` query until the subscription tier flips away from 'free'
     * or POLL_MAX_ATTEMPTS is hit. Stripe writes the new tier asynchronously
     * via webhook, so the user can land here before their User doc reflects
     * the upgrade.
     */
    async function pollMe() {
      pollAttempts.value += 1
      // refreshMe() swallows transient network/auth blips and returns false
      // on failure so the poll loop keeps ticking until POLL_MAX_ATTEMPTS.
      const ok = await authStore.refreshMe()

      if (ok) {
        const currentTier = authStore.user?.subscription?.tier

        if (currentTier && currentTier !== 'free') {
          confirming.value = false
          return
        }
      }

      if (pollAttempts.value >= POLL_MAX_ATTEMPTS) {
        confirming.value = false
        return
      }

      pollTimer.value = setTimeout(() => pollMe(), POLL_INTERVAL_MS)
    }

    /** Route to the Today screen. */
    function goToToday() {
      router.push({ name: 'today' })
    }

    /** Route to the settings screen. */
    function goToSettings() {
      router.push({ name: 'settings' })
    }
  }
}
</script>

<style lang="scss" scoped>
.billing-success {
  &__card {
    @apply rounded-2xl border border-paper-3 bg-paper-1 p-6 sm:p-8 dark:border-ink/20 dark:bg-ink/5;
  }
  &__status {
    @apply text-[15px] leading-relaxed text-muted;
  }
  &__lede {
    @apply text-[16px] leading-relaxed text-ink;
  }
  &__next {
    @apply mt-3 text-[13px] text-muted;
  }
  &__actions {
    @apply mt-6 flex flex-wrap gap-3;
  }
  &__icon {
    @apply ml-1 inline-block h-4 w-4;
  }
  &__code {
    @apply rounded bg-paper-3 px-1 py-0.5 font-mono text-[12px] dark:bg-ink/20;
  }
}
</style>
