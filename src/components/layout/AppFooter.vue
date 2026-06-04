<template>
  <footer class="app-footer">
    <nav class="app-footer__links" :aria-label="t('legal.footerAria')">
      <RouterLink :to="{ name: 'legal-privacy' }" class="app-footer__link">
        <ShieldCheckIcon class="app-footer__icon" aria-hidden="true" />
        {{ t('legal.privacyTitle') }}
      </RouterLink>

      <span class="app-footer__sep" aria-hidden="true">
        ·
      </span>

      <RouterLink :to="{ name: 'legal-terms' }" class="app-footer__link">
        <DocumentTextIcon class="app-footer__icon" aria-hidden="true" />
        {{ t('legal.termsTitle') }}
      </RouterLink>
    </nav>

    <p class="app-footer__copy">
      {{ t('legal.footerCopyright', { year: currentYear }) }}
    </p>
  </footer>
</template>

<script>
/**
 * AppFooter — global footer exposing the public legal document links
 * (Privacy Policy + Terms of Service). This is the primary in-product linking
 * point required by gate G-05.
 *
 * Mounted in both `AppShell` (authenticated app) and `AuthLayout` (sign-in /
 * register) so the links are reachable signed-in and signed-out.
 */
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ShieldCheckIcon, DocumentTextIcon } from '@heroicons/vue/24/outline'

export default {
  name: 'AppFooter',
  components: { RouterLink, ShieldCheckIcon, DocumentTextIcon },
  setup() {
    const { t } = useI18n()
    const currentYear = new Date().getFullYear()
    return { t, currentYear }
  }
}
</script>

<style lang="scss" scoped>
.app-footer {
  @apply flex flex-col items-center gap-2 px-4 py-6 text-center;
  border-top: 1px solid var(--rule-soft);

  @media (min-width: 640px) {
    @apply flex-row justify-between gap-4 text-left;
  }

  &__links {
    @apply flex items-center gap-2 text-[12px];
  }

  &__link {
    @apply inline-flex items-center gap-1.5 transition-colors;
    color: var(--ink-2);

    &:hover {
      color: var(--accent);
    }

    &:focus-visible {
      @apply outline outline-2 outline-offset-2 rounded-sm;
      outline-color: var(--accent);
    }
  }

  &__icon {
    @apply h-3.5 w-3.5;
  }

  &__sep {
    color: var(--muted);
  }

  &__copy {
    @apply m-0 text-[11px];
    color: var(--muted);
  }
}
</style>
