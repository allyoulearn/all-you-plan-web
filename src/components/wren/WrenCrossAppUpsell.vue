<template>
  <AppCard class="wren-cross-upsell" variant="default">
    <!-- Eyebrow -->
    <div class="wren-cross-upsell__head">
      <SparklesIcon class="wren-cross-upsell__icon" aria-hidden="true" />

      <span class="wren-cross-upsell__eyebrow">
        From the All You family
      </span>
    </div>

    <!-- Title -->
    <h3 class="wren-cross-upsell__title">
      Get Wren as your chief-of-staff
    </h3>

    <!-- Body copy -->
    <p class="wren-cross-upsell__body">
      Wren is the AI sibling product to All You Plan — a multi-business AI that sits
      across every All You app you use plus Gmail, Calendar, Slack and WhatsApp.
      Triages, drafts, decides what to surface, and asks before it acts.
    </p>

    <!-- CTA row -->
    <div class="wren-cross-upsell__cta-row">
      <!-- Primary CTA -->
      <a
        :href="wrenUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="wren-cross-upsell__cta"
      >
        Try Wren
        <ArrowUpRightIcon class="wren-cross-upsell__cta-icon" aria-hidden="true" />
      </a>

      <!-- Dismiss -->
      <button
        type="button"
        class="wren-cross-upsell__dismiss"
        @click="$emit('dismiss')"
      >
        Maybe later
      </button>
    </div>
  </AppCard>
</template>

<script>
import { computed } from 'vue'
import { SparklesIcon, ArrowUpRightIcon } from '@heroicons/vue/24/outline'
import AppCard from '@/components/ui/AppCard.vue'
import { WREN_URL } from '@/config/env.js'

/**
 * WrenCrossAppUpsell — small cross-product CTA inside Plan that points at
 * the standalone Wren product. Surfaces at the end of the Daily Review when
 * the user is in a high-intent reflective moment.
 *
 * This is the ONLY cross-repo work in the Wren Sprint-1 P0 scope. It links
 * out to Wren's landing page (or, with the `?upgrade=` query, the relevant
 * Stripe checkout flow). Keep the surface minimal — one component + one
 * insert in ReviewView.
 *
 * Props:
 *   - plan ('managed_single_monthly' | 'managed_multi_monthly'):
 *       the suggested Wren plan to pre-select. Default is multi.
 *
 * Env:
 *   - VITE_WREN_URL — base URL of the Wren product, resolved via
 *     src/config/env.js. Required in production builds (fail-fast); falls back
 *     to a dev-only localhost default so dev runs without the env still
 *     produce a clickable link.
 */
export default {
  name: 'WrenCrossAppUpsell',
  components: { AppCard, SparklesIcon, ArrowUpRightIcon },
  props: {
    plan: {
      type: String,
      default: 'managed_multi_monthly',
      validator: (v) =>
        [
          'byok_monthly',
          'managed_single_monthly',
          'managed_multi_monthly',
          'enterprise',
        ].includes(v),
    },
  },
  emits: ['dismiss'],
  setup(props) {
    /** Destination URL for the Try Wren CTA, with the suggested plan pre-selected. */
    const wrenUrl = computed(() => {
      return `${WREN_URL.replace(/\/$/, '')}/?upgrade=${encodeURIComponent(props.plan)}`
    })

    return { wrenUrl }
  },
}
</script>

<style lang="scss" scoped>
.wren-cross-upsell {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wren-cross-upsell__head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.wren-cross-upsell__icon {
  width: 1rem;
  height: 1rem;
  color: var(--accent, #b87f00);
}

.wren-cross-upsell__eyebrow {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted, #777);
}

.wren-cross-upsell__title {
  margin: 4px 0 0;
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.wren-cross-upsell__body {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.45;
  color: var(--muted, #555);
}

.wren-cross-upsell__cta-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-top: 6px;
}

.wren-cross-upsell__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.4rem 0.75rem;
  border-radius: 0.5rem;
  background: var(--accent, #b87f00);
  color: var(--accent-ink, white);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;

  &:hover { filter: brightness(1.05); }
}

.wren-cross-upsell__cta-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.wren-cross-upsell__dismiss {
  font-size: 0.85rem;
  background: none;
  border: 0;
  color: var(--muted, #777);
  cursor: pointer;

  &:hover { color: var(--ink, #222); }
}
</style>
