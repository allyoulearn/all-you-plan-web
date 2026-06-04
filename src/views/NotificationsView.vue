<template>
  <div>
    <!-- Settings breadcrumb -->
    <RouterLink :to="{ name: 'settings' }" class="crumb">
      {{ t('notifications.crumb') }}
    </RouterLink>

    <!-- Screen heading -->
    <AppScreenHeading
      :eyebrow="t('notifications.eyebrow')"
      :title="t('notifications.headingPrefix')"
      :emphasis="t('notifications.headingEmphasis')"
    >
      <template #meta>
        {{ t('notifications.metaLine1') }}<br />{{ t('notifications.metaLine2') }}
      </template>
    </AppScreenHeading>

    <!-- Loading state -->
    <div v-if="loading && !settings" class="notif__status">
      {{ t('notifications.loading') }}
    </div>

    <!-- Error state — surfaces a failed settings load with a retry. -->
    <AppErrorState
      v-else-if="store.error"
      :message="store.error || t('common.loadError')"
      :retry-label="t('common.retry')"
      @retry="store.load()"
    />

    <!-- Settings content -->
    <template v-else-if="settings">
      <!-- Permission denied banner -->
      <div v-if="settings.permission === 'denied'" class="notif__permission">
        <div class="notif__permission-ic">
          <AppIcon name="bolt" :size="18" />
        </div>

        <div class="notif__permission-t">
          <div class="notif__permission-l">
            {{ t('notifications.permissionTitle') }}
          </div>

          <div class="notif__permission-d">
            {{ t('notifications.permissionDesc') }}
          </div>
        </div>

        <AppButton variant="primary">
          {{ t('notifications.openSettings') }}
        </AppButton>
      </div>

      <!-- Channels section -->
      <AppSectionHeader :label="t('notifications.sectionChannels')" />

      <div class="notif__card">
        <!-- Push channel -->
        <div class="notif__device">
          <div class="notif__device-ic">
            <AppIcon name="today" :size="18" />
          </div>

          <div>
            <div class="notif__device-name">
              {{ t('notifications.pushTitle') }}
            </div>

            <div class="notif__device-meta">
              {{ pushMetaLabel }}
            </div>
          </div>

          <span class="notif__spacer" />

          <button
            type="button"
            :class="['toggle', { 'toggle--on': settings.pushEnabled }]"
            :aria-pressed="settings.pushEnabled"
            @click="setChannel('pushEnabled', !settings.pushEnabled)"
          />
        </div>

        <!-- Email channel -->
        <div class="notif__device">
          <div class="notif__device-ic">
            <AppIcon name="inbox" :size="18" />
          </div>

          <div>
            <div class="notif__device-name">
              {{ t('notifications.emailTitle') }}
            </div>

            <div class="notif__device-meta">
              {{ userEmail }}
            </div>
          </div>

          <span class="notif__spacer" />

          <button
            type="button"
            :class="['toggle', { 'toggle--on': settings.emailEnabled }]"
            :aria-pressed="settings.emailEnabled"
            @click="setChannel('emailEnabled', !settings.emailEnabled)"
          />
        </div>

        <!-- In-app channel -->
        <div class="notif__device">
          <div class="notif__device-ic">
            <AppIcon name="chat" :size="18" />
          </div>

          <div>
            <div class="notif__device-name">
              {{ t('notifications.inAppTitle') }}
            </div>

            <div class="notif__device-meta">
              {{ t('notifications.inAppMeta') }}
            </div>
          </div>

          <span class="notif__spacer" />

          <button
            type="button"
            :class="['toggle', { 'toggle--on': settings.inAppEnabled }]"
            :aria-pressed="settings.inAppEnabled"
            @click="setChannel('inAppEnabled', !settings.inAppEnabled)"
          />
        </div>
      </div>

      <!-- Per-category preferences -->
      <AppSectionHeader :label="t('notifications.sectionPerCategory')" />

      <div class="notif__table">
        <!-- Table header -->
        <div class="notif__table-head">
          <div>
            {{ t('notifications.columnNotification') }}
          </div>

          <div>
            {{ t('notifications.columnPush') }}
          </div>

          <div>
            {{ t('notifications.columnEmail') }}
          </div>

          <div>
            {{ t('notifications.columnInApp') }}
          </div>
        </div>

        <!-- Category rows -->
        <div v-for="row in rows" :key="row.id" class="notif__table-row">
          <div>
            <div class="notif__row-name">
              {{ row.label }}
            </div>

            <div class="notif__row-desc">
              {{ row.desc }}
            </div>
          </div>

          <div class="notif__cell">
            <button
              type="button"
              :class="['toggle', { 'toggle--on': pref(row.id).push }]"
              @click="setPref(row.id, 'push', !pref(row.id).push)"
            />
          </div>

          <div class="notif__cell">
            <button
              type="button"
              :class="['toggle', { 'toggle--on': pref(row.id).email }]"
              @click="setPref(row.id, 'email', !pref(row.id).email)"
            />
          </div>

          <div class="notif__cell">
            <button
              type="button"
              :class="['toggle', { 'toggle--on': pref(row.id).inApp }]"
              @click="setPref(row.id, 'inApp', !pref(row.id).inApp)"
            />
          </div>
        </div>
      </div>

      <!-- Quiet hours -->
      <AppSectionHeader :label="t('notifications.sectionQuietHours')" />

      <div class="notif__card notif__card--padded">
        <div class="notif__row-between">
          <div>
            <div class="notif__row-name">
              {{ t('notifications.quietHoursRange', { start: settings.quietHoursStart, end: settings.quietHoursEnd }) }}
            </div>

            <div class="notif__row-desc">
              {{ t('notifications.quietHoursDesc') }}
            </div>
          </div>

          <button
            type="button"
            :class="['toggle', { 'toggle--on': settings.quietHoursEnabled }]"
            @click="setChannel('quietHoursEnabled', !settings.quietHoursEnabled)"
          />
        </div>
      </div>

      <!-- Daily briefing time -->
      <AppSectionHeader :label="t('notifications.sectionDailyBriefingTime')" />

      <div class="notif__card notif__card--padded">
        <div class="notif__row-name">
          {{ t('notifications.briefingTitle', { time: settings.dailyBriefingTime }) }}
        </div>

        <div class="notif__row-desc">
          {{ t('notifications.briefingDesc') }}
        </div>

        <div class="notif__time-row">
          <AppButton
            v-for="time in ['06:30', '07:00', '07:30', '08:00']"
            :key="time"
            :variant="settings.dailyBriefingTime === time ? 'primary' : 'default'"
            size="sm"
            @click="setChannel('dailyBriefingTime', time)"
          >
            {{ time }}
          </AppButton>
        </div>
      </div>

      <!-- Devices -->
      <AppSectionHeader :label="t('notifications.sectionDevices')" />

      <div class="notif__card">
        <div v-for="d in devices" :key="d.id" class="notif__device">
          <div class="notif__device-ic">
            <AppIcon :name="d.platform === 'web' ? 'today' : 'today'" :size="18" />
          </div>

          <div>
            <div class="notif__device-name">
              {{ d.label }}<span v-if="d.current" class="notif__you-tag">
                {{ t('notifications.thisDeviceTag') }}
              </span>
            </div>

            <div class="notif__device-meta">
              {{ t('notifications.deviceMeta', { platform: d.platform, time: relativeTime(d.lastSeenAt) }) }}
            </div>
          </div>

          <span :class="['notif__status-pill', { 'notif__status-pill--err': d.status === 'stale' }]">
            {{ d.status === 'stale' ? t('notifications.statusStale') : t('notifications.statusLive') }}
          </span>

          <AppButton
            v-if="!d.current"
            variant="ghost"
            size="sm"
            @click="revoke(d.id)"
          >
            {{ t('notifications.revoke') }}
          </AppButton>

          <AppButton
            v-else
            variant="ghost"
            size="sm"
            disabled
          >
            {{ t('notifications.revoke') }}
          </AppButton>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useNotificationsStore } from '@/stores/notifications.store.js'
import { useAuthStore } from '@/stores/auth.store.js'
import { useRelativeTime } from '@/composables/useRelativeTime.js'
import { captureException } from '@/utils/sentry.js'
import AppScreenHeading from '@/components/ui/AppScreenHeading.vue'
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'

const ROW_IDS = [
  { id: 'tasks.due', labelKey: 'notifications.rowTasksDueLabel', descKey: 'notifications.rowTasksDueDesc' },
  { id: 'tasks.overdue', labelKey: 'notifications.rowTasksOverdueLabel', descKey: 'notifications.rowTasksOverdueDesc' },
  { id: 'chores.due', labelKey: 'notifications.rowChoresDueLabel', descKey: 'notifications.rowChoresDueDesc' },
  { id: 'chores.streak-risk', labelKey: 'notifications.rowChoresStreakRiskLabel', descKey: 'notifications.rowChoresStreakRiskDesc' },
  { id: 'briefing.am', labelKey: 'notifications.rowBriefingAmLabel', descKey: 'notifications.rowBriefingAmDesc' },
  { id: 'review.weekly', labelKey: 'notifications.rowReviewWeeklyLabel', descKey: 'notifications.rowReviewWeeklyDesc' },
  { id: 'wren.proactive', labelKey: 'notifications.rowWrenProactiveLabel', descKey: 'notifications.rowWrenProactiveDesc' }
]

export default {
  name: 'NotificationsView',
  components: { AppScreenHeading, AppSectionHeader, AppButton, AppIcon, AppErrorState, RouterLink },
  setup() {
    const { t } = useI18n()
    const store = useNotificationsStore()
    const auth = useAuthStore()

    onMounted(() => store.load())

    const { relativeTime } = useRelativeTime('notifications')

    const settings = computed(() => store.settings)
    const devices = computed(() => store.devices)
    const loading = computed(() => store.loading)
    const userEmail = computed(() => auth.user?.email ?? t('notifications.fallbackEmail'))

    const rows = computed(() =>
      ROW_IDS.map(r => ({ id: r.id, label: t(r.labelKey), desc: t(r.descKey) }))
    )

    const pushMetaLabel = computed(() => {
      const count = devices.value.length
      const key = count === 1 ? 'notifications.pushMetaSingular' : 'notifications.pushMetaPlural'
      return t(key, { count })
    })

    return { t, store, settings, devices, loading, rows, userEmail, pushMetaLabel, pref, setPref, setChannel, revoke, relativeTime }

    // -- Function definitions --

    /**
     * Read the per-channel preference row for a notification category,
     * defaulting to all-off so the table renders even when the server has not
     * yet sent a row for a newly added category.
     * @param {string} categoryId
     * @returns {{ push: boolean, email: boolean, inApp: boolean }}
     */
    function pref(categoryId) {
      return settings.value?.preferences?.find(p => p.categoryId === categoryId) ?? {
        push: false,
        email: false,
        inApp: false
      }
    }

    /**
     * Persist a per-category channel preference flip.
     * @param {string} categoryId
     * @param {string} channel - "push" | "email" | "inApp"
     * @param {boolean} value
     */
    function setPref(categoryId, channel, value) {
      // The store toasts + re-throws on failure; catch the rejection so it
      // doesn't surface as an unhandled promise, and report it to Sentry.
      swallow(store.updatePreference(categoryId, { [channel]: value }))
    }

    /**
     * Persist a top-level channel/option flip on the settings doc.
     * @param {string} key
     * @param {boolean|string} value
     */
    function setChannel(key, value) {
      // Toasted + re-thrown by the store; swallow the rejection and report.
      swallow(store.updateSettings({ [key]: value }))
    }

    /**
     * Revoke a registered device by id.
     * @param {string} id
     */
    function revoke(id) {
      // Toasted + re-thrown by the store; swallow the rejection and report.
      swallow(store.revokeDevice(id))
    }
  }
}

/**
 * Attach a Sentry-reporting catch to a fire-and-forget store mutation. The
 * store already toasts the failure; this just keeps the rejection from
 * surfacing as an unhandled promise. `Promise.resolve` tolerates stores or
 * test spies that return a non-promise.
 * @param {unknown} maybePromise
 */
function swallow(maybePromise) {
  Promise.resolve(maybePromise).catch(captureException)
}
</script>

<style lang="scss" scoped>
.crumb {
  @apply mb-2 inline-block font-mono uppercase;
  color: var(--muted);
  font-size: 11px;
  letter-spacing: 0.1em;
}

.notif {
  &__status { @apply text-[13px] text-muted; }

  &__permission {
    @apply mb-5 flex items-center gap-3.5 rounded-[14px] border p-[18px];
    background: color-mix(in oklab, var(--bad) 8%, var(--paper-2));
    border-color: color-mix(in oklab, var(--bad) 40%, var(--rule-soft));
  }
  &__permission-ic {
    @apply grid h-9 w-9 place-items-center rounded-lg;
    background: color-mix(in oklab, var(--bad) 18%, var(--paper-2));
    color: var(--bad);
  }
  &__permission-t { @apply flex-1; }
  &__permission-l { @apply text-[14px] font-semibold; }
  &__permission-d {
    @apply mt-0.5 text-[13px];
    color: var(--muted);
  }

  &__card {
    @apply rounded-[14px] shadow-sm;
    background: var(--paper-2);

    &--padded { @apply p-5; }
  }

  &__device {
    @apply grid items-center gap-3.5 border-b border-rule-soft px-5 py-4;
    grid-template-columns: 36px 1fr auto auto;

    &:last-child { @apply border-b-0; }
  }
  &__device-ic {
    @apply grid h-9 w-9 place-items-center rounded-lg;
    background: var(--paper-3);
  }
  &__device-name { @apply text-[14px] font-medium; }
  &__device-meta {
    @apply mt-0.5 font-mono text-xs;
    color: var(--muted);
    letter-spacing: 0.02em;
  }
  &__you-tag {
    @apply ml-2 rounded border border-rule-soft px-1.5 py-0.5 font-mono uppercase;
    color: var(--muted);
    font-size: 9px;
    letter-spacing: 0.14em;
  }
  &__status-pill {
    @apply inline-flex items-center gap-1.5 font-mono uppercase;
    color: var(--ok);
    font-size: 11px;
    letter-spacing: 0.04em;

    &::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: var(--ok);
    }
    &--err {
      color: var(--bad);
      &::before { background: var(--bad); }
    }
  }
  &__spacer { @apply flex-1; }

  &__table {
    @apply overflow-hidden rounded-[14px] shadow-sm;
    background: var(--paper-2);
  }
  &__table-head, &__table-row {
    @apply grid items-center gap-3.5 border-b border-rule-soft px-5 py-3.5;
    grid-template-columns: 1fr 80px 80px 80px;
  }
  &__table-head {
    @apply font-mono uppercase;
    background: var(--paper-3);
    color: var(--muted);
    font-size: 10px;
    letter-spacing: 0.14em;

    > div:not(:first-child) { @apply text-center; }
  }
  &__table-row:last-child { @apply border-b-0; }
  &__row-name { @apply text-[14px] font-medium; }
  &__row-desc {
    @apply mt-0.5 text-xs;
    color: var(--muted);
  }
  &__cell { @apply grid place-items-center; }
  &__row-between {
    @apply flex items-center justify-between gap-3;
  }
  &__time-row { @apply mt-3 flex flex-wrap gap-2; }
}

.toggle {
  @apply relative h-[18px] w-8 cursor-pointer rounded-full transition-colors;
  background: var(--rule-soft);
  border: 0;

  &::after {
    content: '';
    @apply absolute left-0.5 top-0.5 h-3.5 w-3.5 rounded-full transition-all;
    background: var(--paper-2);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  &--on { background: var(--accent); }
  &--on::after { left: 16px; }
}
</style>
