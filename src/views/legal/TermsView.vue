<template>
  <main class="legal-page">
    <article class="legal-doc">
      <AppScreenHeading
        title="Terms of"
        emphasis="Service"
      />

      <!-- Draft banner — this copy is a placeholder skeleton and must be
         replaced with the legal-reviewed source before publication. -->
      <p class="legal-doc__draft" role="status">
        {{ t('legal.draftNotice') }}
      </p>

      <p class="legal-doc__updated">
        {{ t('legal.lastUpdated', { date: lastUpdated }) }}
      </p>

      <p class="legal-doc__lede">
        This page is the public Terms of Service surface for all you plan. The
        sections below outline the topics the final, legal-reviewed terms will
        cover. None of the text on this page is binding until it is replaced by
        counsel-approved copy.
      </p>

      <AppSectionHeader label="Acceptance of terms" />

      <p class="legal-doc__body">
        The conditions under which you may use all you plan, and confirmation
        that creating an account constitutes acceptance, will be stated here.
      </p>

      <AppSectionHeader label="Your account" />

      <p class="legal-doc__body">
        Your responsibilities for keeping your credentials secure, eligibility
        requirements, and the activity permitted on your account will be set out
        in the approved terms.
      </p>

      <AppSectionHeader label="Acceptable use" />

      <p class="legal-doc__body">
        The conduct expected of you and the uses that are prohibited will be
        described here.
      </p>

      <AppSectionHeader label="Subscriptions and billing" />

      <p class="legal-doc__body">
        Paid plan terms, renewals, and cancellation handling through our payment
        processor will be documented in the approved terms.
      </p>

      <AppSectionHeader label="Content and intellectual property" />

      <p class="legal-doc__body">
        Ownership of the content you create, the rights you grant us to operate
        the service, and our intellectual-property rights will be set out here.
      </p>

      <AppSectionHeader label="Disclaimers and liability" />

      <p class="legal-doc__body">
        Warranty disclaimers and the limitation of liability will be stated in
        the counsel-approved terms.
      </p>

      <AppSectionHeader label="Termination" />

      <p class="legal-doc__body">
        How either party may end the agreement, and what happens to your data
        afterwards, will be described here. Account deletion is available from the
        in-app privacy controls.
      </p>

      <AppSectionHeader label="Contact" />

      <p class="legal-doc__body">
        How to reach us with questions about these terms will be provided in the
        approved document.
      </p>

      <!-- Cross-link to the companion legal document. -->
      <p class="legal-doc__crosslink">
        {{ t('legal.seeAlsoPrivacy') }}
        <RouterLink :to="{ name: 'legal-privacy' }" class="legal-doc__link">
          {{ t('legal.privacyTitle') }}
        </RouterLink>
      </p>
    </article>
  </main>
</template>

<script>
/**
 * TermsView — public, unauthenticated Terms of Service document surface
 * (gate G-05 / LEG-01).
 *
 * IMPORTANT: the body text here is a non-binding DRAFT skeleton. It exists so
 * the route, footer links, and store reviewers resolve to a real page; it must
 * be replaced with counsel-approved copy before launch. Do not treat it as the
 * final terms.
 */
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppScreenHeading from '@/components/ui/AppScreenHeading.vue'
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue'

export default {
  name: 'TermsView',
  components: { AppScreenHeading, AppSectionHeader, RouterLink },
  setup() {
    const { t } = useI18n()
    // Placeholder date — the real "Last updated" date is set when counsel
    // approves the final copy.
    const lastUpdated = 'TBD'
    return { t, lastUpdated }
  }
}
</script>

<style lang="scss" scoped>
.legal-page {
  // These routes render outside AppShell, so they own their page padding and
  // background. Min-height fills the viewport; tokens keep it dark-mode aware.
  @apply min-h-screen px-4 pb-16 pt-8;
  background: var(--paper);

  @media (min-width: 768px) {
    @apply px-7 pt-12;
  }
}

.legal-doc {
  @apply mx-auto w-full max-w-2xl;

  &__draft {
    @apply mt-2 rounded-md px-4 py-3 text-[13px] font-medium;
    color: var(--warn);
    background: color-mix(in oklab, var(--warn) 8%, var(--paper-2));
    border: 1px solid color-mix(in oklab, var(--warn) 28%, var(--rule-soft));
  }

  &__updated {
    @apply mt-3 text-[12px];
    color: var(--muted);
  }

  &__lede {
    @apply mt-4 text-[15px] leading-relaxed;
    color: var(--ink-2);
  }

  &__body {
    @apply mt-1 text-[14px] leading-relaxed;
    color: var(--ink-2);
  }

  &__crosslink {
    @apply mt-10 text-[13px];
    color: var(--muted);
  }

  &__link {
    color: var(--accent);
    text-decoration: underline;
  }
}
</style>
