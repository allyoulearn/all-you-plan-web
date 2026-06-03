<template>
  <div class="privacy-view">
    <AppScreenHeading
      eyebrow="System · Privacy"
      title="Your data,"
      emphasis="your call"
    />

    <!-- Export -->
    <AppSectionHeader label="Data export" />

    <div class="privacy-view__card">
      <h4>
        Download your data
      </h4>

      <p>
        Build a JSON archive of everything stored in your account — tasks,
        projects, journal entries, calendar connections (tokens redacted),
        Wren conversations, and briefings. The download link expires in 24
        hours.
      </p>

      <AppButton variant="default" :disabled="exporting" @click="onExport">
        {{ exporting ? 'Building archive…' : 'Build export' }}
      </AppButton>

      <div v-if="exportInfo" class="privacy-view__export-result" role="status">
        <p>
          Archive ready ({{ formatBytes(exportInfo.sizeBytes) }}). Expires at
          {{ formatDate(exportInfo.expiresAt) }}.
        </p>

        <a :href="exportInfo.downloadUrl" download>
          Download archive
        </a>

        <p class="privacy-view__hash">
          SHA-256: {{ exportInfo.sha256 }}
        </p>
      </div>
    </div>

    <!-- Import -->
    <AppSectionHeader label="Import" />

    <div class="privacy-view__card">
      <h4>
        Import from another app
      </h4>

      <p>
        Paste a Todoist JSON export, a Things JSON export, an Apple Reminders
        .ics file, or a previous Plan backup, then choose the source. The
        import wraps every insert in a transaction so a failure rolls back
        cleanly.
      </p>

      <RouterLink :to="{ name: 'import' }" class="privacy-view__link">
        Open the import flow
      </RouterLink>
    </div>

    <!-- Delete -->
    <AppSectionHeader label="Delete account" />

    <div class="privacy-view__card privacy-view__card--danger">
      <div v-if="pendingDeletion">
        <h4>
          Deletion scheduled
        </h4>

        <p>
          Your account will be permanently deleted on
          {{ formatDate(pendingDeletion.purgeAt) }}. You can cancel any time
          before then.
        </p>

        <AppButton variant="default" :disabled="cancelling" @click="onCancelDeletion">
          {{ cancelling ? 'Canceling…' : 'Cancel deletion' }}
        </AppButton>
      </div>

      <div v-else>
        <h4>
          Schedule deletion
        </h4>

        <p>
          Starts a 30-day grace window. During the window you can cancel
          from this page or any signed-in client. Your Stripe subscription
          is canceled at period end immediately and every active session is
          signed out.
        </p>

        <label>
          Reason (optional)
          <textarea
            v-model="deleteReason"
            rows="3"
            maxlength="500"
            placeholder="Helps us improve. Optional."
          />
        </label>

        <AppButton variant="primary" :disabled="deleting" @click="onRequestDeletion">
          {{ deleting ? 'Requesting…' : 'Request deletion' }}
        </AppButton>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * PrivacyView — Phase 4 Item B / C UI for the GDPR endpoints. Builds the
 * data-export archive, links to the import flow, and lets the user
 * schedule (or cancel) a soft-delete request. The cancel banner lives on
 * the same page so a user who lands here mid-grace-window sees the option
 * at the top.
 */
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth.store.js'
import { apolloClient } from '@/api/apollo.js'
import {
  REQUEST_DATA_EXPORT,
  REQUEST_ACCOUNT_DELETION,
  CANCEL_ACCOUNT_DELETION
} from '@/api/operations/gdpr.js'
import AppScreenHeading from '@/components/ui/AppScreenHeading.vue'
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'

export default {
  name: 'PrivacyView',
  components: { AppScreenHeading, AppSectionHeader, AppButton, RouterLink },
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()
    const exporting = ref(false)
    const exportInfo = ref(null)
    const deleteReason = ref('')
    const deleting = ref(false)
    const cancelling = ref(false)

    const pendingDeletion = computed(() => authStore.user?.pendingDeletion ?? null)

    return {
      pendingDeletion,
      exporting,
      exportInfo,
      deleteReason,
      deleting,
      cancelling,
      onExport,
      onRequestDeletion,
      onCancelDeletion,
      formatDate,
      formatBytes
    }

    function formatDate(iso) {
      if (!iso) return ''
      const d = new Date(iso)
      return Number.isNaN(d.getTime()) ? '' : d.toLocaleString()
    }

    function formatBytes(n) {
      if (!n) return '0 B'
      if (n < 1024) return `${n} B`
      if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
      return `${(n / 1024 / 1024).toFixed(2)} MB`
    }

    async function onExport() {
      exporting.value = true
      exportInfo.value = null

      try {
        const { data } = await apolloClient.mutate({ mutation: REQUEST_DATA_EXPORT })
        exportInfo.value = data?.requestDataExport ?? null
        toast.success('Archive ready')
      } catch (err) {
        toast.error('Could not build export', { description: err?.message })
      } finally {
        exporting.value = false
      }
    }

    async function onRequestDeletion() {
      if (!window.confirm('Schedule account deletion in 30 days?')) return
      deleting.value = true

      try {
        await apolloClient.mutate({
          mutation: REQUEST_ACCOUNT_DELETION,
          variables: { reason: deleteReason.value || null }
        })

        toast.success('Deletion scheduled. You will be signed out.')
        // The server bumps tokenVersion and clears the cookie; bounce to login
        // so the user sees the cancel link in the goodbye email.
        await authStore.logout?.()
        router.push({ name: 'login' })
      } catch (err) {
        toast.error('Could not schedule deletion', { description: err?.message })
      } finally {
        deleting.value = false
      }
    }

    async function onCancelDeletion() {
      cancelling.value = true

      try {
        await apolloClient.mutate({ mutation: CANCEL_ACCOUNT_DELETION })
        toast.success('Deletion canceled')
        await authStore.refreshMe?.()
      } catch (err) {
        toast.error('Could not cancel', { description: err?.message })
      } finally {
        cancelling.value = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.privacy-view {
  &__card {
    @apply mt-2 flex flex-col gap-3 rounded-[14px] p-5;
    background: var(--paper-2);
    border: 1px solid var(--rule-soft);

    h4 {
      @apply m-0 text-[15px];
      color: var(--ink);
    }
    p {
      @apply m-0 text-[13px] leading-snug;
      color: var(--ink-2);
    }
    label {
      @apply flex flex-col gap-1.5 text-[12px];
      color: var(--ink-2);
    }
    textarea {
      @apply w-full rounded-xl border border-rule-soft px-4 py-3 text-[14px];
      background: var(--paper);
      color: var(--ink);
    }

    &--danger {
      background: color-mix(in oklab, var(--bad) 6%, var(--paper-2));
      border: 1px solid color-mix(in oklab, var(--bad) 25%, var(--rule-soft));

      h4 {
        color: var(--bad);
      }
    }
  }

  &__export-result {
    @apply mt-2 flex flex-col gap-1 text-[13px];
    color: var(--ink-2);

    a {
      color: var(--accent);
      text-decoration: underline;
    }
  }

  &__hash {
    @apply font-mono break-all;
    font-size: 10px;
  }

  &__link {
    color: var(--accent);
    text-decoration: underline;
  }
}
</style>
