<template>
  <main class="legal-page">
    <article class="legal-doc">
      <AppScreenHeading
        title="Privacy"
        emphasis="Policy"
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
        This page is the public Privacy Policy surface for all you plan. The
        sections below outline the topics the final, legal-reviewed policy will
        cover. None of the text on this page is binding until it is replaced by
        counsel-approved copy.
      </p>

      <AppSectionHeader label="Who we are" />

      <p class="legal-doc__body">
        The data controller, legal entity name, and a contact address will be
        stated here, alongside the security contact for data and privacy
        enquiries.
      </p>

      <AppSectionHeader label="Information we collect" />

      <p class="legal-doc__body">
        Account details (your name, email, and password), and the content you
        create in the app — tasks, goals, projects, journal entries, chores,
        inbox items, and anything you share with household members.
      </p>

      <AppSectionHeader label="Connected services" />

      <p class="legal-doc__body">
        Where you connect a Google or Microsoft calendar, the access required to
        sync events and how those credentials are stored will be described here.
        Billing is handled by our payment processor; Wren may send the content
        you submit to third-party AI providers to generate responses; and
        diagnostic and crash data may be collected to keep the service reliable.
      </p>

      <AppSectionHeader label="How we use your information" />

      <p class="legal-doc__body">
        The purposes for processing — operating your account, providing the
        planning features, support, security, and legal compliance — and the
        lawful bases for each will be set out in the approved policy.
      </p>

      <AppSectionHeader label="Your rights and choices" />

      <p class="legal-doc__body">
        You can export an archive of your data and request account deletion from
        the in-app privacy controls. Deletion runs on a grace window before the
        data is permanently removed. The final policy will detail these rights in
        full, including how to exercise them.
      </p>

      <AppSectionHeader label="Data retention and transfers" />

      <p class="legal-doc__body">
        Retention periods, international data-transfer safeguards, and our stance
        on use by children will be documented here.
      </p>

      <AppSectionHeader label="Contact" />

      <p class="legal-doc__body">
        How to reach us with privacy questions or requests will be provided in
        the approved policy.
      </p>

      <!-- Cross-link to the companion legal document. -->
      <p class="legal-doc__crosslink">
        {{ t('legal.seeAlsoTerms') }}
        <RouterLink :to="{ name: 'legal-terms' }" class="legal-doc__link">
          {{ t('legal.termsTitle') }}
        </RouterLink>
      </p>
    </article>
  </main>
</template>

<script>
/**
 * PrivacyPolicyView — public, unauthenticated Privacy Policy document surface
 * (gate G-05 / LEG-01).
 *
 * IMPORTANT: the body text here is a non-binding DRAFT skeleton. It exists so
 * the route, footer links, and store reviewers resolve to a real page; it must
 * be replaced with counsel-approved copy before launch. Do not treat it as the
 * final policy.
 *
 * Distinct from `@/views/PrivacyView.vue`, which is the GDPR data-export /
 * account-deletion control surface, not the legal document.
 */
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppScreenHeading from '@/components/ui/AppScreenHeading.vue'
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue'

export default {
  name: 'PrivacyPolicyView',
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
