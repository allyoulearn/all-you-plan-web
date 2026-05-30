<template>
  <div class="wren-view">
    <AppScreenHeading
      :eyebrow="`${t('nav.withWren')} · ${t('nav.itemChat')}`"
      :title="t('wren.headingPrefix')"
      :emphasis="t('wren.headingEmphasis')"
    />

    <div class="wren-view__layout">
      <!-- Left rail: conversation list (md+ only; collapses on mobile) -->
      <aside class="wren-view__rail">
        <WrenConversationRail
          :conversations="store.conversations"
          :active-id="store.activeConversationId"
          @create="onCreateConversation"
          @select="onSelectConversation"
        />
      </aside>

      <!-- Conversation column -->
      <section class="wren-view__chat">
        <div class="wren-view__chat-frame">
          <!-- Messages area: per-day buckets with a sticky date divider per
               group. As the user scrolls, the next day's divider naturally
               pushes the previous one out of the sticky slot (CSS-only, no
               scroll listener needed). -->
          <div ref="bodyRef" class="wren-view__messages">
            <!--
              Gate loading/empty/messages so the empty-state copy never flashes
              before the first store.load() resolves. Until `loaded`
              flips true we render the loading indicator regardless of the store's
              loading flag (which starts false).
            -->
            <div v-if="!loaded || store.loading" class="wren-view__loading">
              {{ t('common.loading') }}
            </div>

            <template v-else-if="messageGroups.length">
              <section
                v-for="group in messageGroups"
                :key="group.date"
                class="wren-view__day-group"
              >
                <div class="wren-view__date-divider">
                  <span class="wren-view__date-label">
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

            <div v-else class="wren-view__empty">
              <p class="wren-view__empty-text">
                {{ t('wren.emptyState') }}
              </p>
            </div>
          </div>

          <!-- Composer: chips + input live inside the same encased frame so the
               whole conversation reads as one continuous surface. -->
          <div class="wren-view__composer">
            <!-- Quick-prompt chips -->
            <div class="wren-view__chips">
              <button
                v-for="prompt in QUICK_PROMPTS"
                :key="prompt"
                type="button"
                class="wren-view__chip"
                @click="fillFromChip(prompt)"
              >
                {{ prompt }}
              </button>
            </div>

            <!-- Input bar -->
            <div class="wren-view__input-bar">
              <form
                class="wren-view__input-container"
                @submit.prevent="sendMessage"
              >
                <input
                  v-model="draft"
                  :placeholder="t('wren.inputPlaceholder')"
                  :aria-label="t('wren.messageAriaLabel')"
                  class="wren-view__input"
                  @keydown="handleKeydown"
                />

                <button
                  type="submit"
                  class="wren-view__send"
                  :disabled="!draft.trim() || store.sending"
                  :aria-label="t('wren.sendAriaLabel')"
                >
                  {{ t('wren.send') }}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
/** WrenView — full-screen AI chat interface with message history, quick-prompt chips, and input bar. */
import { onMounted, ref, watch, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import AppScreenHeading from '@/components/ui/AppScreenHeading.vue'
import WrenBubble from '@/components/wren/WrenBubble.vue'
import WrenConversationRail from '@/components/wren/WrenConversationRail.vue'
import { useWrenChat, QUICK_PROMPTS } from '@/composables/useWrenChat.js'
import { groupMessagesByDay } from '@/utils/date.js'

export default {
  name: 'WrenView',
  components: { AppScreenHeading, WrenBubble, WrenConversationRail },
  setup() {
    // -- State --
    const { t } = useI18n()
    const bodyRef = ref(null)
    const { store, draft, sendMessage, handleKeydown, fillFromChip } = useWrenChat(bodyRef)

    // Tracks whether the initial load has resolved so we don't briefly
    // render the empty state before useWrenChat's onMounted load completes
    //. Initialise from the current store.loading so a fresh
    // mount with an already-populated store doesn't have to wait a tick
    // for `loaded` to flip true (preserves the existing synchronous test
    // surface).
    const loaded = ref(!store.loading)

    onMounted(() => {
      if (!store.loading) {
        loaded.value = true
        scrollMessagesToBottom()
      }
    })

    watch(
      () => store.loading,
      isLoading => {
        if (!isLoading) {
          loaded.value = true
          // First load just finished — pin the view to the latest message so
          // the user lands at the end of the conversation, not the top.
          scrollMessagesToBottom()
        }
      }
    )

    // Messages bucketed by local day with a pre-rendered label per group.
    // Drives the sticky date-divider stack inside the scrolling messages
    // surface — each group renders its own header, and CSS sticky takes care
    // of swapping which one is pinned as the user scrolls.
    const messageGroups = computed(() => groupMessagesByDay(store.messages))

    return {
      t,
      QUICK_PROMPTS,
      bodyRef,
      store,
      draft,
      sendMessage,
      handleKeydown,
      fillFromChip,
      messageGroups,
      loaded,
      onCreateConversation,
      onSelectConversation
    }

    // -- Function definitions --

    /**
     * Scroll the messages container to the bottom after the next tick so the
     * conversation lands at the most recent message. Runs after switches and
     * after the initial load resolves.
     */
    function scrollMessagesToBottom() {
      nextTick(() => {
        const el = bodyRef.value
        if (el) el.scrollTop = el.scrollHeight
      })
    }

    /**
     * Spin up a new blank conversation and clear the draft so the user can
     * start typing without leftover state.
     */
    function onCreateConversation() {
      store.createConversation()
      draft.value = ''
      scrollMessagesToBottom()
    }

    /**
     * Switch the active conversation, then pin to the bottom of the new
     * history so the user sees the most recent turn first.
     */
    async function onSelectConversation(id) {
      await store.switchConversation(id)
      scrollMessagesToBottom()
    }
  }
}
</script>

<style lang="scss" scoped>
.wren-view {
  // The view fills the main content column. The internal layout (rail +
  // chat) splits horizontally on lg+ so the conversation reclaims the
  // breathing room previously left as empty gutter.
  @apply flex h-full flex-col;

  &__layout {
    @apply flex w-full flex-1 flex-col gap-6;
    min-height: 0;

    @media (min-width: 1024px) {
      @apply flex-row gap-8;
    }
  }

  &__rail {
    // Mobile: rail collapses to a horizontal strip above the chat — kept
    // simple to defer the drawer pattern until a future iteration. On lg+ it
    // becomes a true left column with a comfortable reading width.
    @apply w-full shrink-0;

    @media (min-width: 1024px) {
      @apply w-[240px];
    }

    @media (min-width: 1280px) {
      @apply w-[280px];
    }
  }

  &__chat {
    @apply flex min-w-0 flex-1 flex-col;
    min-height: 0;
  }

  // Encased frame: visually separates the conversation from the surrounding
  // page so it reads as a contained surface, not a stretch of empty paper.
  // Background is a soft tinted lift via color-mix — bg-paper-2 with opacity
  // modifiers isn't supported on the CSS-var color tokens.
  &__chat-frame {
    @apply flex w-full flex-1 flex-col overflow-hidden rounded-2xl border border-rule-soft;
    min-height: 0;
    background-color: color-mix(in oklab, var(--paper-2) 50%, transparent);
  }

  // No max-width here — let the conversation use the available column.
  // Bubbles inside still cap their own widths (75-80%) so single messages
  // never run edge-to-edge on very wide screens. `pb-8` gives the latest
  // message room to breathe before the composer rather than sitting flush
  // against the top edge of the input frame.
  &__messages {
    @apply flex w-full flex-1 flex-col overflow-y-auto px-5 pb-8;
    min-height: 0;
  }

  // Each per-day group is its own flex column so the sticky date divider
  // sticks within the group's box. When the user scrolls past the group, the
  // next group's divider naturally pushes the previous one out of the
  // sticky slot — no scroll listener required.
  &__day-group {
    @apply flex flex-col gap-4;
  }

  &__day-group + &__day-group {
    @apply mt-4;
  }

  &__date-divider {
    // Sticky at the top of the scrolling messages surface. The blurred
    // backdrop keeps the chip readable while messages slide under it; the
    // negative margin-x cancels the surrounding `px-5` so the blur fills
    // the full surface edge-to-edge.
    @apply sticky top-0 z-10 -mx-5 flex items-center justify-center px-5 pt-1 pb-2;
    background: color-mix(in oklab, var(--paper-2) 80%, transparent);
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

  // Composer block sits flush at the bottom of the frame: chips + input share
  // the same horizontal padding as the messages so they line up vertically.
  &__composer {
    @apply flex w-full flex-col gap-2 border-t border-rule-soft px-5 pt-3 pb-3;
    background-color: color-mix(in oklab, var(--paper-2) 35%, transparent);
  }

  &__chips {
    @apply flex w-full flex-wrap gap-2;
  }

  &__chip {
    @apply rounded-pill border border-rule-soft bg-paper-2 px-3 py-1 text-[11px] text-muted transition-colors;
    @apply hover:bg-paper-3 hover:text-ink;
  }

  &__input-bar {
    @apply w-full;
  }

  &__input-container {
    @apply flex items-center gap-2 rounded-pill border border-rule-soft bg-paper-2 py-1.5 pl-4 pr-1.5;
    @apply focus-within:border-muted;
  }

  &__input {
    @apply flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-muted;
  }

  &__send {
    @apply rounded-pill bg-ink px-3.5 py-1.5 text-[12px] font-semibold text-paper transition-opacity;
    @apply disabled:opacity-40;
  }
}
</style>
