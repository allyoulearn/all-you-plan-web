<template>
  <div class="wren-view">
    <ScreenHeading eyebrow="With Wren · Chat" title="A longer" emphasis="conversation." />

    <!-- Date divider -->
    <div class="wren-view__date-divider">
      <span class="wren-view__date-label">
        {{ today }}
      </span>
    </div>

    <!-- Messages area -->
    <div ref="bodyRef" class="wren-view__messages">
      <!--
        Gate loading/empty/messages so the empty-state copy never flashes
        before the first store.load() resolves (WEB-W4-19). Until `loaded`
        flips true we render the loading indicator regardless of the store's
        loading flag (which starts false).
      -->
      <div v-if="!loaded || store.loading" class="wren-view__loading">
        {{ t('common.loading') }}
      </div>

      <template v-else-if="store.messages.length">
        <WrenBubble
          v-for="msg in store.messages"
          :key="msg.id"
          :message="msg"
          @action="fillFromChip"
          @undo="token => store.undo(token)"
          @confirm="token => store.confirm(token)"
          @cancel="token => store.cancel(token)"
        />
      </template>

      <div v-else class="wren-view__empty">
        <p class="wren-view__empty-text">
          {{ t('wren.emptyState') }}
        </p>
      </div>
    </div>

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
</template>

<script>
/** WrenView — full-screen AI chat interface with message history, quick-prompt chips, and input bar. */
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import WrenBubble from '@/components/wren/WrenBubble.vue'
import { useWrenChat, QUICK_PROMPTS } from '@/composables/useWrenChat.js'

export default {
  name: 'WrenView',
  components: { ScreenHeading, WrenBubble },
  setup() {
    // -- State --
    const { t } = useI18n()
    const bodyRef = ref(null)
    const { store, draft, sendMessage, handleKeydown, fillFromChip } = useWrenChat(bodyRef)

    // Tracks whether the initial load has resolved so we don't briefly
    // render the empty state before useWrenChat's onMounted load completes
    // (WEB-W4-19). Initialise from the current store.loading so a fresh
    // mount with an already-populated store doesn't have to wait a tick
    // for `loaded` to flip true (preserves the existing synchronous test
    // surface).
    const loaded = ref(!store.loading)
    onMounted(() => {
      if (!store.loading) {
        loaded.value = true
      }
    })
    watch(
      () => store.loading,
      isLoading => {
        if (!isLoading) loaded.value = true
      }
    )

    // Captured once at setup; the divider never needs to react mid-session
    // (WEB-W4-18 parallels the WEB-T08-011 fix for ReviewView).
    const today = new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })

    return {
      t,
      QUICK_PROMPTS,
      bodyRef,
      store,
      draft,
      sendMessage,
      handleKeydown,
      fillFromChip,
      today,
      loaded
    }
  }
}
</script>

<style lang="scss" scoped>
.wren-view {
  @apply flex h-full flex-col;

  &__date-divider {
    @apply mb-5 flex items-center justify-center;
  }

  &__date-label {
    @apply font-mono text-[11px] uppercase tracking-[0.14em] text-muted;
  }

  &__messages {
    @apply mx-auto flex w-full max-w-[820px] flex-1 flex-col gap-4 overflow-y-auto pb-4;
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

  &__chips {
    @apply mx-auto mt-4 flex w-full max-w-[820px] flex-wrap gap-2;
  }

  &__chip {
    @apply rounded-pill border border-rule-soft bg-paper-2 px-3 py-1 text-[11px] text-muted transition-colors;
    @apply hover:bg-paper-3 hover:text-ink;
  }

  &__input-bar {
    @apply mx-auto mt-3 w-full max-w-[820px] pb-4;
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
