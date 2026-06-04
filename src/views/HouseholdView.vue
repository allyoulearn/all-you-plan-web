<template>
  <div>
    <!-- Settings breadcrumb -->
    <RouterLink :to="{ name: 'settings' }" class="crumb">
      {{ t('household.crumb') }}
    </RouterLink>

    <!-- Screen heading -->
    <AppScreenHeading
      :eyebrow="t('household.eyebrow')"
      :title="t('household.headingPrefix')"
      :emphasis="t('household.headingEmphasis')"
    >
      <template #meta>
        {{ t('household.metaLine1') }}<br />{{ t('household.metaLine2') }}
      </template>
    </AppScreenHeading>

    <!-- Inline error banner (passive load failures) -->
    <div v-if="error" class="house__error" role="alert">
      <span class="house__error-text">
        {{ error }}
      </span>

      <AppButton
        size="sm"
        variant="ghost"
        class="house__error-retry"
        @click="retry"
      >
        {{ t('common.retry') }}
      </AppButton>
    </div>

    <!-- Loading state -->
    <div v-if="loading && !household && !invitations.length" class="house__status">
      {{ t('household.loading') }}
    </div>

    <template v-else>
      <!-- ===================== SOLO ===================== -->
      <div v-if="state === 'solo'" class="house-empty">
        <div class="house-empty__eyebrow">
          {{ t('household.soloEyebrow') }}
        </div>

        <h3 class="house-empty__h">
          {{ t('household.soloHeadingPrefix') }}<br />

          <em>
            {{ t('household.soloHeadingEmphasis') }}
          </em>
        </h3>

        <p class="house-empty__lede">
          {{ t('household.soloLede') }}
        </p>

        <form class="house-empty__form" @submit.prevent="submitInvite">
          <AppTextField
            v-model="inviteEmail"
            type="email"
            icon="envelope"
            :label="t('household.inviteByEmail')"
            :placeholder="t('household.invitePlaceholder')"
            autocomplete="email"
          />

          <AppButton
            variant="primary"
            type="submit"
            icon="paper-airplane"
            :disabled="saving || !inviteEmail.trim()"
          >
            {{ saving ? t('household.sending') : t('household.sendInvitation') }}
          </AppButton>
        </form>

        <div class="house-empty__note">
          {{ t('household.soloNote') }}
        </div>
      </div>

      <!-- ===================== SENT ===================== -->
      <template v-else-if="state === 'sent'">
        <AppSectionHeader :label="t('household.sentSection')" />

        <div class="house-card house-card--flush">
          <div v-for="inv in pendingInvitations" :key="inv.id" class="invite-row">
            <div class="invite-row__ic">
              <AppIcon name="paper-airplane" :size="16" />
            </div>

            <div class="invite-row__body">
              <div class="invite-row__who">
                {{ inv.email }}
              </div>

              <div class="invite-row__sub">
                {{ t('household.sentMeta', { sent: relativeTime(inv.sentAt), expires: expiresLabel(inv.expiresAt) }) }}
              </div>
            </div>

            <span class="pill pill--warn">
              {{ t('household.statusWaiting') }}
            </span>

            <AppButton variant="ghost" :disabled="saving" @click="cancel(inv.id)">
              {{ t('household.cancel') }}
            </AppButton>
          </div>
        </div>

        <div class="house-explainer">
          <div class="house-explainer__eyebrow">
            {{ t('household.sentExplainerTitle') }}
          </div>

          <p class="house-explainer__body">
            {{ t('household.sentExplainerBefore') }}
            <span class="share-pill">
              {{ t('household.scopePrivate') }}
            </span>
            {{ t('household.sentExplainerMid') }}
            <span class="share-pill share-pill--shared">
              {{ t('household.scopeShared') }}
            </span>{{ t('household.sentExplainerAfter') }}
          </p>
        </div>
      </template>

      <!-- ===================== RECEIVED ===================== -->
      <template v-else-if="state === 'received'">
        <AppSectionHeader :label="t('household.receivedSection')" />

        <div v-for="inv in receivedInvitations" :key="inv.id" class="house-card house-card--received">
          <div class="member-avatar member-avatar--partner member-avatar--lg">
            {{ inviterInitial(inv) }}
          </div>

          <div class="house-card__received-body">
            <div class="house-card__received-title">
              {{ t('household.receivedTitle', { name: inviterName(inv) }) }}
            </div>

            <div class="house-card__received-meta">
              {{ t('household.receivedMeta', { email: inv.email, sent: relativeTime(inv.sentAt), expires: expiresLabel(inv.expiresAt) }) }}
            </div>
          </div>

          <AppButton variant="ghost" :disabled="saving" @click="decline(inv.id)">
            {{ t('household.decline') }}
          </AppButton>

          <AppButton variant="primary" :disabled="saving" @click="accept(inv.id)">
            {{ t('household.accept') }}
          </AppButton>
        </div>

        <div class="house-explainer">
          <div class="house-explainer__eyebrow">
            {{ t('household.receivedExplainerTitle') }}
          </div>

          <p class="house-explainer__body">
            {{ t('household.receivedExplainerBody') }}
          </p>
        </div>
      </template>

      <!-- ===================== ACTIVE ===================== -->
      <template v-else-if="state === 'active'">
        <AppSectionHeader :label="t('household.membersSection', { count: members.length })" />

        <div class="house-card">
          <div class="house-card__name-row">
            <div class="house-card__name">
              {{ household.name }}
            </div>

            <AppButton variant="ghost" size="sm">
              {{ t('household.editName') }}
            </AppButton>
          </div>

          <div v-for="member in members" :key="member.userId" class="member-row">
            <div :class="['member-avatar', member.isYou ? 'member-avatar--me' : 'member-avatar--partner']">
              {{ member.initial }}
            </div>

            <div class="member-row__body">
              <div class="member-row__name">
                {{ member.name }}<span v-if="member.isYou" class="you-tag">
                  {{ t('household.youTag') }}
                </span>
              </div>

              <div class="member-row__meta">
                {{ t('household.memberJoined', { date: joinedLabel(member.joinedAt) }) }}
              </div>
            </div>

            <AppButton
              v-if="member.isYou"
              variant="ghost"
              size="sm"
              disabled
            >
              {{ t('household.remove') }}
            </AppButton>

            <AppButton
              v-else
              variant="ghost"
              size="sm"
              class="member-row__remove"
              :disabled="saving"
              @click="openRemove(member)"
            >
              {{ t('household.removeFull') }}
            </AppButton>
          </div>
        </div>

        <!-- Sharing on each surface -->
        <AppSectionHeader :label="t('household.sharingSection')" />

        <div class="house-card house-card--padded">
          <div class="house-share__lede">
            {{ t('household.sharingLede') }}
          </div>

          <div class="house-share__list">
            <div v-for="(s, i) in sharingExamples" :key="i" class="house-share__row">
              <div class="house-share__title">
                <div class="house-share__t">
                  {{ s.title }}
                </div>

                <div class="house-share__sub">
                  {{ s.sub }}
                </div>
              </div>

              <span :class="['share-pill', s.shared ? 'share-pill--shared' : '']">
                <AppIcon :name="s.shared ? 'user-group' : 'lock'" :size="11" />
                {{ s.shared ? t('household.scopeShared') : t('household.scopePrivate') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Activity today -->
        <template v-if="activity.length">
          <AppSectionHeader :label="t('household.activitySection')" />

          <div class="house-card house-card--padded">
            <div class="activity-feed">
              <div v-for="item in activity" :key="item.id" class="activity-row">
                <div :class="['activity-row__av', isYouActor(item) ? 'activity-row__av--me' : '']">
                  {{ item.actorInitial }}
                </div>

                <div class="activity-row__t">
                  <strong>
                    {{ isYouActor(item) ? t('household.youTagSentence') : item.actorName }}
                  </strong>

                  {{ item.verb }} <strong>
                    {{ item.subject }}
                  </strong>
                </div>

                <div class="activity-row__when">
                  {{ relativeTime(item.at) }}
                </div>
              </div>
            </div>
          </div>
        </template>

        <div class="house__privacy-note">
          {{ t('household.privacyNote') }}
        </div>

        <!-- Leave household -->
        <div class="house__leave">
          <AppButton
            variant="default"
            icon="user-minus"
            :disabled="saving"
            @click="showLeave = true"
          >
            {{ t('household.leave') }}
          </AppButton>
        </div>
      </template>

      <!-- ===================== PARTNER LEFT ===================== -->
      <template v-else-if="state === 'partnerLeft'">
        <AppSectionHeader :label="t('household.partnerLeftSection')" />

        <div class="house-card house-card--padded house-card--gap">
          <div class="house-card__name">
            {{ t('household.partnerLeftTitle') }}
          </div>

          <p class="house-card__muted">
            {{ t('household.partnerLeftBody') }}
          </p>

          <div class="house-card__actions">
            <AppButton variant="primary" icon="plus" @click="startReinvite">
              {{ t('household.inviteSomeoneNew') }}
            </AppButton>

            <AppButton variant="ghost">
              {{ t('household.restoreShared') }}
            </AppButton>

            <AppButton variant="ghost">
              {{ t('household.reviewReverted') }}
            </AppButton>
          </div>

          <form v-if="reinviting" class="house-empty__form house-empty__form--inline" @submit.prevent="submitInvite">
            <AppTextField
              v-model="inviteEmail"
              type="email"
              icon="envelope"
              :label="t('household.inviteByEmail')"
              :placeholder="t('household.invitePlaceholder')"
              autocomplete="email"
            />

            <AppButton
              variant="primary"
              type="submit"
              icon="paper-airplane"
              :disabled="saving || !inviteEmail.trim()"
            >
              {{ saving ? t('household.sending') : t('household.sendInvitation') }}
            </AppButton>
          </form>
        </div>
      </template>
    </template>

    <!-- Remove member confirmation -->
    <AppConfirmDialog
      :model-value="!!removingMember"
      :title="t('household.removeTitle')"
      :message="removingMember ? t('household.removeMessage', { name: removingMember.name }) : ''"
      :confirm-label="t('household.removeConfirm')"
      :cancel-label="t('common.cancel')"
      :busy="saving"
      :busy-label="t('household.removing')"
      @update:model-value="onRemoveDialogToggle"
      @confirm="confirmRemove"
    />

    <!-- Leave household confirmation -->
    <AppConfirmDialog
      :model-value="showLeave"
      :title="t('household.leaveTitle')"
      :message="t('household.leaveMessage')"
      :confirm-label="t('household.leaveConfirm')"
      :cancel-label="t('common.cancel')"
      :busy="saving"
      :busy-label="t('household.leaving')"
      @update:model-value="onLeaveDialogToggle"
      @confirm="confirmLeave"
    />
  </div>
</template>

<script>
/**
 * HouseholdView — Settings sub-page for two-person shared planning. Renders one
 * of five derived states (solo / sent / received / active / partnerLeft) driven
 * by `householdStore.state`. Mirrors the design's HouseholdScreen; reuses the
 * shared UI primitives and the Settings back-crumb pattern.
 */
import { onMounted, computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useHouseholdStore } from '@/stores/household.store.js'
import { useRelativeTime } from '@/composables/useRelativeTime.js'
import AppScreenHeading from '@/components/ui/AppScreenHeading.vue'
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppTextField from '@/components/ui/AppTextField.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'

export default {
  name: 'HouseholdView',
  components: {
    RouterLink,
    AppScreenHeading,
    AppSectionHeader,
    AppButton,
    AppIcon,
    AppTextField,
    AppConfirmDialog
  },
  setup() {
    const { t } = useI18n()
    const store = useHouseholdStore()
    const { relativeTime } = useRelativeTime('household')

    const inviteEmail = ref('')
    const reinviting = ref(false)
    const removingMember = ref(null)
    const showLeave = ref(false)

    onMounted(() => store.load())

    const household = computed(() => store.household)
    const invitations = computed(() => store.invitations)
    const pendingInvitations = computed(() => store.pendingInvitations)
    const activity = computed(() => store.activity)
    const loading = computed(() => store.loading)
    const saving = computed(() => store.saving)
    const error = computed(() => store.error)
    const state = computed(() => store.state)
    const members = computed(() => store.household?.members ?? [])

    // Invitations addressed to the current user (someone else sent them).
    const receivedInvitations = computed(() =>
      pendingInvitations.value.filter(inv => inv.invitedBy && inv.invitedBy !== 'you')
    )

    // Self-highlight in the activity feed keys on the current member's name,
    // not a hardcoded label, so it survives locale/data changes.
    const youName = computed(() => store.youMember?.name ?? null)

    // Static illustrative sharing examples — the per-surface scope pills are a
    // design affordance shown on the household screen (the real scope lives on
    // each item's edit sheet). Localised so copy tracks the active language.
    const sharingExamples = computed(() => [
      { title: t('household.shareEx1Title'), sub: t('household.shareEx1Sub'), shared: true },
      { title: t('household.shareEx2Title'), sub: t('household.shareEx2Sub'), shared: false },
      { title: t('household.shareEx3Title'), sub: t('household.shareEx3Sub'), shared: true },
      { title: t('household.shareEx4Title'), sub: t('household.shareEx4Sub'), shared: true }
    ])

    return {
      t,
      relativeTime,
      household,
      invitations,
      pendingInvitations,
      receivedInvitations,
      activity,
      loading,
      saving,
      error,
      state,
      members,
      sharingExamples,
      inviteEmail,
      reinviting,
      removingMember,
      showLeave,
      retry,
      isYouActor,
      inviterName,
      inviterInitial,
      joinedLabel,
      expiresLabel,
      submitInvite,
      startReinvite,
      cancel,
      accept,
      decline,
      openRemove,
      onRemoveDialogToggle,
      confirmRemove,
      onLeaveDialogToggle,
      confirmLeave
    }

    // -- Function definitions --

    /** Re-issue the household load after a failed passive fetch. */
    function retry() {
      store.load()
    }

    /** True when an activity row's actor is the current user. */
    function isYouActor(item) {
      return youName.value != null && item.actorName === youName.value
    }

    /** Display name of whoever sent a received invitation. */
    function inviterName(inv) {
      return inv.invitedBy && inv.invitedBy !== 'you'
        ? inv.invitedBy
        : t('household.someone')
    }

    /** First initial of the inviter, for the received-invite avatar. */
    function inviterInitial(inv) {
      const name = inviterName(inv)
      return name ? name.charAt(0).toUpperCase() : '?'
    }

    /** Format a member's join date as a short calendar label. */
    function joinedLabel(iso) {
      if (!iso) return ''
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) return ''
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    }

    /** Relative "expires in N days" label derived from an ISO expiry. */
    function expiresLabel(iso) {
      if (!iso) return ''
      const ms = new Date(iso).getTime() - Date.now()
      if (Number.isNaN(ms)) return ''
      const days = Math.max(0, Math.round(ms / 86400000))
      return t('household.expiresInDays', { count: days })
    }

    /** Send the invite-by-email form (solo + re-invite flows share it). */
    async function submitInvite() {
      const email = inviteEmail.value.trim()
      if (!email || saving.value) return

      try {
        await store.invite(email)
        inviteEmail.value = ''
        reinviting.value = false
      } catch {
        // toasted by store; error ref also surfaces inline
      }
    }

    /** Reveal the inline re-invite form on the partner-left card. */
    function startReinvite() {
      reinviting.value = true
    }

    /** Cancel a pending invitation you sent. */
    async function cancel(id) {
      try {
        await store.cancelInvitation(id)
      } catch {
        // toasted by store
      }
    }

    /** Accept an invitation addressed to you. */
    async function accept(id) {
      try {
        await store.acceptInvitation(id)
      } catch {
        // toasted by store
      }
    }

    /** Decline an invitation addressed to you. */
    async function decline(id) {
      try {
        await store.declineInvitation(id)
      } catch {
        // toasted by store
      }
    }

    /** Open the remove-member confirmation for the given member. */
    function openRemove(member) {
      removingMember.value = member
    }

    /** Close the remove dialog when toggled off (cancel / backdrop / esc). */
    function onRemoveDialogToggle(open) {
      if (!open) removingMember.value = null
    }

    /** Confirm removal of the selected member. */
    async function confirmRemove() {
      if (!removingMember.value || saving.value) return

      try {
        await store.removeMember(removingMember.value.userId)
        removingMember.value = null
      } catch {
        // toasted by store
      }
    }

    /** Close the leave dialog when toggled off. */
    function onLeaveDialogToggle(open) {
      if (!open) showLeave.value = false
    }

    /** Confirm leaving the household. */
    async function confirmLeave() {
      if (saving.value) return

      try {
        await store.leave()
        showLeave.value = false
      } catch {
        // toasted by store
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.crumb {
  @apply mb-2 inline-block font-mono uppercase;
  color: var(--muted);
  font-size: 11px;
  letter-spacing: 0.1em;
}

.house {
  &__status { @apply text-[13px] text-muted; }

  &__error {
    @apply mb-4 flex items-center gap-3 rounded-[14px] border p-3.5 text-[13px];
    background: color-mix(in oklab, var(--bad) 8%, var(--paper-2));
    border-color: color-mix(in oklab, var(--bad) 40%, var(--rule-soft));
    color: var(--bad);
  }

  &__error-text {
    @apply min-w-0 flex-1;
  }

  &__error-retry {
    @apply shrink-0;
  }

  &__privacy-note {
    @apply mt-6 text-center text-[12px];
    color: var(--muted);
  }

  &__leave {
    @apply mt-8 flex justify-start;
  }
}

/* ---------- shared card + avatar primitives ---------- */
.house-card {
  @apply flex flex-col gap-3.5 rounded-[16px] p-[22px] shadow-sm;
  background: var(--paper-2);

  &--flush { @apply p-0; }
  &--padded { @apply p-[18px]; }
  &--gap { @apply gap-3.5; }

  &--received {
    @apply flex-row items-center gap-4;
  }

  &__received-body { @apply flex-1; }
  &__received-title {
    @apply font-serif italic;
    font-size: 24px;
    color: var(--ink);
  }
  &__received-meta {
    @apply mt-1 text-[13px];
    color: var(--muted);
  }

  &__name-row {
    @apply flex items-center justify-between pb-1;
  }
  &__name {
    @apply font-serif italic;
    font-size: 22px;
    color: var(--ink);
  }
  &__muted {
    @apply m-0 text-[14px] leading-relaxed;
    color: var(--ink-2);
  }
  &__actions {
    @apply mt-1 flex flex-wrap gap-2;
  }
}

.member-avatar {
  @apply grid flex-none place-items-center rounded-full font-semibold;
  width: 40px;
  height: 40px;
  font-size: 14px;

  &--me { background: var(--accent); color: var(--accent-ink); }
  &--partner { background: var(--ink); color: var(--paper); }
  &--lg {
    width: 56px;
    height: 56px;
    font-size: 18px;
  }
}

.member-row {
  @apply flex items-center gap-3.5 border-b border-rule-soft py-3;

  &:last-child { @apply border-b-0; }
  &__body { @apply flex-1; }
  &__name { @apply text-[15px] font-medium; color: var(--ink); }
  &__meta {
    @apply mt-0.5 text-[12px];
    color: var(--muted);
  }
  &__remove :deep(.button) { color: var(--bad); }
}

.you-tag {
  @apply ml-2 rounded border border-rule-soft px-1.5 py-0.5 font-mono uppercase;
  color: var(--muted);
  font-size: 9px;
  letter-spacing: 0.14em;
}

/* ---------- solo empty state ---------- */
.house-empty {
  @apply flex flex-col items-center gap-3 rounded-[16px] border border-dashed border-rule-soft px-8 py-10 text-center;
  background: var(--paper-2);

  &__eyebrow {
    @apply font-mono uppercase text-muted;
    font-size: 11px;
    letter-spacing: 0.14em;
  }
  &__h {
    @apply font-serif font-normal;
    font-size: 28px;
    line-height: 1.1;
    color: var(--ink);

    em { font-style: italic; }
  }
  &__lede {
    @apply max-w-sm font-serif italic;
    color: var(--ink-2);
    font-size: 16px;
    line-height: 1.4;
  }
  &__form {
    @apply mt-2 flex w-full max-w-md flex-col gap-3 rounded-[14px] border border-rule-soft p-4;
    background: var(--paper);

    &--inline {
      @apply mt-3 max-w-md;
    }
  }
  &__note {
    @apply mt-3 text-[12px];
    color: var(--muted);
  }
}

/* ---------- invite row (sent) ---------- */
.invite-row {
  @apply grid items-center gap-3.5 border-b border-rule-soft px-[18px] py-3.5;
  grid-template-columns: 40px 1fr auto auto;

  &:last-child { @apply border-b-0; }
  &__ic {
    @apply grid place-items-center rounded-full font-mono;
    width: 40px;
    height: 40px;
    background: var(--paper-3);
    color: var(--muted);
    font-size: 12px;
  }
  &__who { @apply text-[14px] font-medium; color: var(--ink); }
  &__sub {
    @apply mt-0.5 text-[12px];
    color: var(--muted);
  }
}

/* ---------- explainer card (sent / received) ---------- */
.house-explainer {
  @apply mt-4 rounded-[16px] p-[18px] shadow-sm;
  background: var(--paper-2);

  &__eyebrow {
    @apply mb-2 font-mono uppercase text-muted;
    font-size: 11px;
    letter-spacing: 0.14em;
  }
  &__body {
    @apply m-0 text-[14px] leading-relaxed;
    color: var(--ink-2);
  }
}

/* ---------- pills ---------- */
.pill {
  @apply inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium;
  background: var(--paper-3);
  color: var(--ink-2);

  &--warn {
    background: color-mix(in oklab, var(--warn) 14%, transparent);
    color: color-mix(in oklab, var(--warn) 80%, var(--ink));
  }
}

.share-pill {
  @apply inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px];
  border-color: var(--rule-soft);
  color: var(--muted);

  &--shared {
    background: color-mix(in oklab, var(--accent) 12%, transparent);
    color: var(--accent);
    border-color: transparent;
  }
}

/* ---------- sharing list (active) ---------- */
.house-share {
  &__lede {
    @apply mb-3.5 text-[13px];
    color: var(--muted);
  }
  &__list { @apply flex flex-col gap-2.5; }
  &__row {
    @apply flex items-center gap-3 px-1.5 py-2.5;
  }
  &__title { @apply flex-1; }
  &__t { @apply text-[14px] font-medium; color: var(--ink); }
  &__sub {
    @apply mt-0.5 text-[12px];
    color: var(--muted);
  }
}

/* ---------- activity feed (active) ---------- */
.activity-feed { @apply flex flex-col; }
.activity-row {
  @apply grid items-center gap-3 border-b border-rule-soft py-3;
  grid-template-columns: 36px 1fr auto;

  &:last-child { @apply border-b-0; }
  &__av {
    @apply grid place-items-center rounded-full font-semibold;
    width: 28px;
    height: 28px;
    background: var(--ink);
    color: var(--paper);
    font-size: 11px;

    &--me { background: var(--accent); color: var(--accent-ink); }
  }
  &__t {
    @apply text-[13px] leading-snug;
    color: var(--ink-2);

    strong { @apply font-semibold; color: var(--ink); }
  }
  &__when {
    @apply font-mono uppercase;
    color: var(--muted);
    font-size: 10px;
    letter-spacing: 0.04em;
  }
}
</style>
