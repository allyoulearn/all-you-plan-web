<template>
  <!--
    Cookie consent banner (Phase 4 Item C).

    Anchored fixed to the bottom of the viewport so it doesn't shift app
    content layout. Renders only when the user has not yet decided
    (`hasDecided()` is false) so a stale render never blocks the UI.

    Two CTAs by design — "Accept all" and "Essential only". A future
    "Customise" link can land on a /privacy page with per-bucket toggles
    without changing this contract.

    No `aria-hidden` toggling: the banner is mounted-or-unmounted via
    `v-if`, which is cleaner for screen readers than an `aria-hidden`
    visibility dance.
  -->
  <div
    v-if="visible"
    class="cookie-banner"
    role="dialog"
    :aria-label="t('cookieBanner.ariaLabel')"
    data-testid="cookie-consent-banner"
  >
    <div class="cookie-banner__copy">
      <h3 class="cookie-banner__title">
        {{ t('cookieBanner.title') }}
      </h3>

      <p class="cookie-banner__desc">
        {{ t('cookieBanner.description') }}
      </p>
    </div>

    <div class="cookie-banner__actions">
      <button
        type="button"
        class="cookie-banner__btn cookie-banner__btn--ghost"
        @click="onEssentialOnly"
      >
        {{ t('cookieBanner.essentialOnly') }}
      </button>

      <button
        type="button"
        class="cookie-banner__btn cookie-banner__btn--primary"
        @click="onAcceptAll"
      >
        {{ t('cookieBanner.acceptAll') }}
      </button>
    </div>
  </div>
</template>

<script>
/**
 * CookieConsentBanner — first-render banner that gates analytics SDKs
 * behind explicit user consent. Mounts once at App.vue and self-hides
 * after the user makes a choice; the choice is persisted in
 * localStorage via src/utils/cookieConsent.js.
 */
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { acceptAll, essentialOnly, hasDecided } from '@/utils/cookieConsent.js'

export default {
  name: 'CookieConsentBanner',
  setup() {
    const { t } = useI18n()
    const visible = ref(false)

    onMounted(() => {
      // Only render after mount so SSR / first-paint never flashes the
      // banner for already-decided users. `hasDecided` reads localStorage
      // which is unavailable during SSR.
      visible.value = !hasDecided()
    })

    return { t, visible, onAcceptAll, onEssentialOnly }

    function onAcceptAll() {
      acceptAll()
      visible.value = false
    }

    function onEssentialOnly() {
      essentialOnly()
      visible.value = false
    }
  }
}
</script>

<style lang="scss" scoped>
.cookie-banner {
  @apply fixed bottom-4 left-4 right-4 z-50 flex flex-col gap-3 rounded-xl border p-4 shadow-lg md:left-auto md:bottom-4 md:right-4 md:max-w-md md:flex-row md:items-center;
  background: var(--paper-2);
  border-color: var(--rule-soft);
  color: var(--ink);

  &__copy {
    @apply flex flex-col gap-1;
  }

  &__title {
    @apply m-0 text-[14px] font-medium;
    color: var(--ink);
  }

  &__desc {
    @apply m-0 text-[12px] leading-snug;
    color: var(--ink-2);
  }

  &__actions {
    @apply flex shrink-0 items-center gap-2;
  }

  &__btn {
    @apply rounded-md px-3 py-2 text-[12px] font-medium transition-colors;

    &--ghost {
      background: transparent;
      color: var(--ink-2);
      border: 1px solid var(--rule-soft);

      &:hover {
        color: var(--ink);
        background: var(--paper);
      }
    }

    &--primary {
      background: var(--accent);
      color: var(--paper);

      &:hover {
        opacity: 0.92;
      }
    }
  }
}
</style>
