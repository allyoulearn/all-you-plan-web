<template>
  <aside
    class="wren-panel"
    :class="{
      'wren-panel--open': wrenOpen,
      'wren-panel--collapsed': wrenCollapsed
    }"
    :aria-hidden="!isVisible"
  >
    <!-- Header -->
    <div class="wren-panel__header">
      <span class="wren-panel__avatar">
        W
      </span>

      <div class="wren-panel__heading">
        <p class="wren-panel__name">
          {{ t('wren.coachName') }}
        </p>

        <p class="wren-panel__role">
          {{ t('wren.coachRole') }}
        </p>
      </div>

      <span class="wren-panel__status">
        <span class="wren-panel__status-dot" />
        {{ t('wren.liveStatus') }}
      </span>

      <button
        type="button"
        class="wren-panel__export-btn"
        :title="t('wren.exportConversation')"
        :aria-label="t('wren.exportConversation')"
        :disabled="exporting"
        @click="onExport"
      >
        <ArrowDownTrayIcon class="wren-panel__export-icon" aria-hidden="true" />
      </button>

      <button
        type="button"
        class="wren-panel__close"
        :aria-label="t('common.closeWren')"
        @click="toggleWren"
      >
        <AppIcon name="x" :size="18" />
      </button>
    </div>

    <!-- Conversation switcher -->
    <div ref="switcherRef" class="wren-panel__switcher">
      <button
        type="button"
        class="wren-panel__switcher-trigger"
        :aria-expanded="conversationsOpen"
        aria-haspopup="listbox"
        :aria-label="t('wren.openConversationListAriaLabel')"
        @click="toggleConversations"
      >
        <span class="wren-panel__switcher-eyebrow">
          {{ t('wren.conversationsHeading') }}
        </span>

        <span class="wren-panel__switcher-title-row">
          <span class="wren-panel__switcher-title">
            {{ activeConversationTitle }}
          </span>

          <ChevronDownIcon
            class="wren-panel__switcher-chevron"
            :class="{ 'wren-panel__switcher-chevron--open': conversationsOpen }"
            aria-hidden="true"
          />
        </span>
      </button>

      <button
        type="button"
        class="wren-panel__switcher-new"
        :aria-label="t('wren.newConversationAriaLabel')"
        :title="t('wren.newConversation')"
        @click="onCreateConversation"
      >
        <PlusIcon class="wren-panel__switcher-new-icon" aria-hidden="true" />
      </button>

      <!-- Conversation list popover -->
      <div
        v-if="conversationsOpen"
        class="wren-panel__switcher-menu"
        role="listbox"
        :aria-label="t('wren.conversationListAriaLabel')"
      >
        <button
          type="button"
          class="wren-panel__switcher-menu-new"
          @click="onCreateConversation"
        >
          <PlusIcon class="wren-panel__switcher-menu-icon" aria-hidden="true" />

          <span>
            {{ t('wren.newConversation') }}
          </span>
        </button>

        <p v-if="!store.conversations.length" class="wren-panel__switcher-menu-empty">
          {{ t('wren.noConversationsYet') }}
        </p>

        <button
          v-for="conv in store.conversations"
          :key="conv.id"
          type="button"
          role="option"
          class="wren-panel__switcher-item"
          :class="{ 'wren-panel__switcher-item--active': conv.id === store.activeConversationId }"
          :aria-selected="conv.id === store.activeConversationId"
          @click="onSelectConversation(conv.id)"
        >
          <span class="wren-panel__switcher-item-title">
            {{ conv.title }}
          </span>

          <span class="wren-panel__switcher-item-meta">
            {{ formatRelative(conv.updatedAt) }}
          </span>
        </button>
      </div>
    </div>

    <!-- Messages body: per-day buckets with a sticky date divider per group.
         Mirrors WrenView so both surfaces share the same scroll behavior. -->
    <div ref="bodyRef" class="wren-panel__body">
      <div v-if="store.loading" class="wren-panel__loading">
        {{ t('common.loading') }}
      </div>

      <template v-else-if="messageGroups.length">
        <section
          v-for="group in messageGroups"
          :key="group.date"
          class="wren-panel__day-group"
        >
          <div class="wren-panel__date-divider">
            <span class="wren-panel__date-label">
              {{ group.label }}
            </span>
          </div>

          <WrenBubble
            v-for="msg in group.messages"
            :key="msg.id"
            :message="msg"
            @action="fillFromChip"
            @undo="token => store.undo(token)"
            @confirm="token => store.confirm(token)"
            @cancel="token => store.cancel(token)"
          />
        </section>
      </template>

      <div v-else class="wren-panel__empty">
        <p class="wren-panel__empty-text">
          {{ t('wren.panelEmptyState') }}
        </p>
      </div>
    </div>

    <!-- Composer: chips + input share the same encased block so they read as
         one continuous surface, matching the WrenView pattern. -->
    <div class="wren-panel__composer">
      <div class="wren-panel__chips">
        <button
          v-for="prompt in QUICK_PROMPTS"
          :key="prompt"
          type="button"
          class="wren-panel__chip"
          @click="fillFromChip(prompt)"
        >
          {{ prompt }}
        </button>
      </div>

      <div class="wren-panel__input-row">
        <input
          v-model="draft"
          :placeholder="t('wren.inputPlaceholder')"
          :aria-label="t('wren.panelInputAriaLabel')"
          class="wren-panel__input"
          @keydown="handleKeydown"
        />

        <button
          type="button"
          class="wren-panel__send"
          :disabled="!draft.trim() || store.sending"
          :aria-label="t('wren.sendAriaLabel')"
          @click="sendMessage"
        >
          {{ t('wren.send') }}
        </button>
      </div>
    </div>
  </aside>
</template>

<script>
/** WrenPanel — right-side AI coach panel with message feed, quick-prompt chips, and input. */
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowDownTrayIcon, ChevronDownIcon, PlusIcon } from '@heroicons/vue/24/outline'
import WrenBubble from '@/components/wren/WrenBubble.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useWrenChat, QUICK_PROMPTS } from '@/composables/useWrenChat.js'
import { useLayout } from '@/composables/useLayout.js'
import { groupMessagesByDay } from '@/utils/date.js'

export default {
  name: 'WrenPanel',
  components: { WrenBubble, ArrowDownTrayIcon, AppIcon, ChevronDownIcon, PlusIcon },
  setup() {
    // -- State --
    const { t } = useI18n()
    const bodyRef = ref(null)
    const switcherRef = ref(null)
    const { store, draft, sendMessage, handleKeydown, fillFromChip } = useWrenChat(bodyRef)
    const exporting = ref(false)
    const conversationsOpen = ref(false)
    const { wrenOpen, wrenCollapsed, toggleWren } = useLayout()

    /**
     * Whether the Wren panel is on-screen for assistive tech (drives aria-hidden).
     * True when the drawer is open below lg, OR when the viewport is wide
     * enough to dock the panel AND the user has not collapsed the dock.
     */
    const isVisible = computed(
      () => wrenOpen.value || (window.innerWidth >= 1024 && !wrenCollapsed.value)
    )

    const activeConversationTitle = computed(() => {
      const active = store.conversations.find(c => c.id === store.activeConversationId)
      return active?.title || t('wren.newConversation')
    })

    // Messages bucketed by local day with a pre-rendered label per group —
    // drives the sticky date-divider stack inside the messages surface.
    const messageGroups = computed(() => groupMessagesByDay(store.messages))

    onMounted(() => {
      document.addEventListener('click', onDocClick)
      document.addEventListener('keydown', onKey)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    })

    return {
      t,
      bodyRef,
      switcherRef,
      store,
      draft,
      sendMessage,
      handleKeydown,
      fillFromChip,
      QUICK_PROMPTS,
      exporting,
      onExport,
      wrenOpen,
      wrenCollapsed,
      toggleWren,
      isVisible,
      conversationsOpen,
      activeConversationTitle,
      messageGroups,
      toggleConversations,
      onCreateConversation,
      onSelectConversation,
      formatRelative
    }

    // -- Function definitions --

    /**
     * Download the current Wren conversation as a markdown file.
     * Uses an in-memory Blob so the export works without server-side file storage.
     */
    async function onExport() {
      exporting.value = true

      try {
        const exp = await store.exportConversation('markdown')
        const blob = new Blob([exp.content], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = exp.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (e) {
        store.error = e?.message || t('wren.exportFailed')
      } finally {
        exporting.value = false
      }
    }

    /** Flip the conversation list popover open/closed. */
    function toggleConversations() {
      conversationsOpen.value = !conversationsOpen.value
    }

    /**
     * Spawn a fresh conversation, clear the draft, and close the popover so the
     * user lands on a clean input.
     */
    function onCreateConversation() {
      store.createConversation()
      draft.value = ''
      conversationsOpen.value = false
      scrollMessagesToBottom()
    }

    /**
     * Switch to another conversation and close the popover. Scroll the new
     * history into view at the bottom so the most recent turn is visible.
     */
    async function onSelectConversation(id) {
      conversationsOpen.value = false
      await store.switchConversation(id)
      scrollMessagesToBottom()
    }

    function scrollMessagesToBottom() {
      nextTick(() => {
        const el = bodyRef.value
        if (el) el.scrollTop = el.scrollHeight
      })
    }

    /** Close the popover on outside click. */
    function onDocClick(e) {
      if (!conversationsOpen.value) return
      const root = switcherRef.value
      if (root && root.contains(e.target)) return
      conversationsOpen.value = false
    }

    /** Close the popover on Escape. */
    function onKey(e) {
      if (e.key === 'Escape' && conversationsOpen.value) {
        e.stopPropagation()
        conversationsOpen.value = false
      }
    }

    /**
     * Short relative timestamp matching WrenConversationRail. Falls back to
     * a locale date for items older than ~7 days.
     */
    function formatRelative(iso) {
      if (!iso) return ''

      try {
        const then = new Date(iso).getTime()
        if (Number.isNaN(then)) return ''
        const diffMs = Date.now() - then
        const minute = 60_000
        const hour = 60 * minute
        const day = 24 * hour
        if (diffMs < minute) return 'now'
        if (diffMs < hour) return `${Math.floor(diffMs / minute)}m`
        if (diffMs < day) return `${Math.floor(diffMs / hour)}h`
        if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}d`
        return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      } catch {
        return ''
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.wren-panel {
  // Drawer (default, <lg): fixed full-height panel slid off the right edge
  // until `--open`. Same state-preserving pattern as AppSidebar.
  @apply fixed inset-y-0 right-0 z-30 flex h-screen w-full max-w-[420px] translate-x-full flex-col overflow-hidden border-l border-rule-soft bg-paper shadow-lg transition-transform duration-200;

  &--open {
    @apply translate-x-0;
  }

  // lg+: dock as the right column of the static grid.
  @media (min-width: 1024px) {
    @apply static z-auto w-auto max-w-none translate-x-0 shadow-none;
  }

  // Collapsed: only meaningful at lg+, since below lg the panel is a drawer
  // that closes via `wrenOpen` instead. Hiding the docked column lets the
  // shell's grid template reclaim the space (see app-shell--wren-collapsed).
  &--collapsed {
    @media (min-width: 1024px) {
      @apply hidden;
    }
  }

  &__header {
    @apply flex items-center gap-3 border-b border-rule-soft px-[22px] py-[18px];
  }

  &__avatar {
    @apply grid h-9 w-9 shrink-0 place-items-center rounded-pill bg-accent font-serif text-[20px] italic text-accent-ink;
  }

  &__heading {
    @apply min-w-0;
  }

  &__name {
    @apply font-serif text-[22px] italic leading-none text-ink;
  }

  &__role {
    @apply mt-0.5 text-[12px] text-muted;
  }

  &__status {
    @apply ml-auto inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] text-muted;
  }

  &__status-dot {
    @apply h-[7px] w-[7px] rounded-pill bg-ok;
  }

  &__export-btn {
    @apply inline-flex items-center justify-center rounded-pill border border-transparent bg-transparent p-1 text-muted transition-colors hover:bg-paper-3 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40;
  }

  &__export-icon {
    @apply h-[18px] w-[18px];
  }

  &__close {
    @apply inline-flex h-8 w-8 items-center justify-center rounded-pill text-muted hover:bg-paper-2 hover:text-ink;

    // The close button is for the drawer only — once docked, there's no
    // reason to hide the panel.
    @media (min-width: 1024px) {
      @apply hidden;
    }
  }

  &__switcher {
    @apply relative flex items-stretch gap-2 border-b border-rule-soft px-[22px] py-2.5;
  }

  &__switcher-trigger {
    @apply flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-paper-2;
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;
  }

  &__switcher-eyebrow {
    @apply font-mono text-[10px] uppercase tracking-[0.14em] text-muted;
  }

  &__switcher-title-row {
    @apply flex w-full min-w-0 items-center gap-1.5;
  }

  &__switcher-title {
    @apply min-w-0 flex-1 truncate text-[13px] font-medium text-ink;
  }

  &__switcher-chevron {
    @apply h-3.5 w-3.5 shrink-0 text-muted transition-transform;

    &--open {
      @apply rotate-180;
    }
  }

  &__switcher-new {
    @apply inline-flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-pill border border-rule-soft bg-paper-2 text-muted transition-colors hover:bg-paper-3 hover:text-ink;
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;
  }

  &__switcher-new-icon {
    @apply h-4 w-4;
  }

  &__switcher-menu {
    @apply absolute left-[22px] right-[22px] top-[calc(100%-4px)] z-20 flex max-h-[60vh] flex-col gap-0.5 overflow-y-auto rounded-xl border border-rule-soft bg-paper p-2 shadow-lg;
  }

  &__switcher-menu-new {
    @apply flex items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] font-medium text-ink transition-colors hover:bg-paper-2;
  }

  &__switcher-menu-icon {
    @apply h-4 w-4;
  }

  &__switcher-menu-empty {
    @apply px-3 py-2 text-[12px] text-muted;
  }

  &__switcher-item {
    @apply flex items-center justify-between gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-paper-2;

    &--active {
      @apply bg-paper-2;
    }
  }

  &__switcher-item-title {
    @apply min-w-0 flex-1 truncate text-[13px] text-ink;
  }

  &__switcher-item-meta {
    @apply font-mono text-[10px] uppercase tracking-wider text-muted;
  }

  // pt-2 + pb-7 gives the latest message air above the chip row instead of
  // sitting flush against the composer's top border. Groups handle their
  // own internal gap so this container drops the global gap-4.
  &__body {
    @apply flex flex-1 flex-col overflow-y-auto px-4 pb-7;
  }

  &__day-group {
    @apply flex flex-col gap-4;
  }

  &__day-group + &__day-group {
    @apply mt-4;
  }

  &__date-divider {
    // Sticky at the top of the scrolling messages surface. The blurred
    // backdrop keeps the chip readable while messages slide under it; the
    // negative margin-x cancels the surrounding `px-4` so the blur fills
    // the full surface edge-to-edge.
    @apply sticky top-0 z-10 -mx-4 flex items-center justify-center px-4 pt-1 pb-2;
    background: color-mix(in oklab, var(--paper) 80%, transparent);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  &__date-label {
    @apply rounded-pill border border-rule-soft bg-paper-2 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted;
  }

  &__loading {
    @apply text-center text-[13px] text-muted;
  }

  &__empty {
    @apply flex flex-1 items-center justify-center text-center;
  }

  &__empty-text {
    @apply text-[13px] text-muted;
  }

  // Composer block sits flush at the bottom of the panel: chips + input share
  // the same encased surface (matching WrenView) so they read as one
  // continuous composer instead of two stacked rows. A single top border
  // separates the whole block from the messages above; the subtle tint
  // distinguishes the composer from the panel body without a heavy edge.
  &__composer {
    @apply flex w-full flex-col gap-2 border-t border-rule-soft px-4 pt-3 pb-3;
    background-color: color-mix(in oklab, var(--paper-2) 35%, transparent);
  }

  &__chips {
    @apply flex w-full flex-wrap gap-2;
  }

  &__chip {
    @apply rounded-pill border border-rule-soft bg-paper-2 px-3 py-1 text-[11px] text-muted transition-colors hover:bg-paper-3 hover:text-ink;
  }

  &__input-row {
    @apply flex items-center gap-2 rounded-pill border border-rule-soft bg-paper-2 py-1.5 pl-4 pr-1.5 focus-within:border-muted;
  }

  &__input {
    @apply flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-muted;
  }

  &__send {
    // Lowercase source (`Send` via t()) with CSS uppercase styling — keeps
    // the visual SEND look while letting screen readers / non-English locales
    // see a normal-cased word.
    @apply rounded-pill bg-ink px-3.5 py-1.5 text-[12px] font-semibold uppercase text-paper transition-opacity disabled:opacity-40;
  }
}
</style>
