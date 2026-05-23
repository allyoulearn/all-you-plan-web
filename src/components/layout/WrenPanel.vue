<template>
  <aside class="wren-panel">
    <!-- Header -->
    <div class="wren-panel__header">
      <span class="wren-panel__avatar">
        W
      </span>

      <div>
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
        title="Export conversation"
        aria-label="Export conversation"
        :disabled="exporting"
        @click="onExport"
      >
        <ArrowDownTrayIcon class="wren-panel__export-icon" aria-hidden="true" />
      </button>
    </div>

    <!-- Messages body -->
    <div ref="bodyRef" class="wren-panel__body">
      <div v-if="store.loading" class="wren-panel__loading">
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

      <div v-else class="wren-panel__empty">
        <p class="wren-panel__empty-text">
          {{ t('wren.panelEmptyState') }}
        </p>
      </div>
    </div>

    <!-- Quick-prompt chips -->
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

    <!-- Input footer -->
    <div class="wren-panel__footer">
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
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowDownTrayIcon } from '@heroicons/vue/24/outline'
import WrenBubble from '@/components/wren/WrenBubble.vue'
import { useWrenChat, QUICK_PROMPTS } from '@/composables/useWrenChat.js'

export default {
  name: 'WrenPanel',
  components: { WrenBubble, ArrowDownTrayIcon },
  setup() {
    // -- State --
    const { t } = useI18n()
    const bodyRef = ref(null)
    const { store, draft, sendMessage, handleKeydown, fillFromChip } = useWrenChat(bodyRef)
    const exporting = ref(false)

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
        store.error = e?.message || 'Export failed'
      } finally {
        exporting.value = false
      }
    }

    return {
      t,
      bodyRef,
      store,
      draft,
      sendMessage,
      handleKeydown,
      fillFromChip,
      QUICK_PROMPTS,
      exporting,
      onExport
    }
  }
}
</script>

<style lang="scss" scoped>
.wren-panel {
  @apply flex h-screen flex-col overflow-hidden border-l border-rule-soft bg-paper;

  &__header {
    @apply flex items-center gap-3 border-b border-rule-soft px-[22px] py-[18px];
  }

  &__avatar {
    @apply grid h-9 w-9 place-items-center rounded-pill bg-accent font-serif text-[20px] italic text-accent-ink;
  }

  &__name {
    @apply font-serif text-[22px] italic leading-none text-ink;
  }

  &__role {
    @apply mt-0.5 text-[12px] text-muted;
  }

  &__status {
    @apply ml-auto inline-flex items-center gap-1.5 text-[11px] text-muted;
  }

  &__status-dot {
    @apply h-[7px] w-[7px] rounded-pill bg-ok;
  }

  &__export-btn {
    @apply ml-2 inline-flex items-center justify-center rounded-pill border border-transparent bg-transparent p-1 text-muted transition-colors hover:bg-paper-3 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40;
  }

  &__export-icon {
    @apply h-[18px] w-[18px];
  }

  &__body {
    @apply flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-5;
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
    @apply flex flex-wrap gap-2 px-4 pb-2;
  }

  &__chip {
    @apply rounded-pill border border-rule-soft bg-paper-2 px-3 py-1 text-[11px] text-muted transition-colors hover:bg-paper-3 hover:text-ink;
  }

  &__footer {
    @apply border-t border-rule-soft p-4;
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
    // see a normal-cased word (WEB-W3-24).
    @apply rounded-pill bg-ink px-3.5 py-1.5 text-[12px] font-semibold uppercase text-paper transition-opacity disabled:opacity-40;
  }
}
</style>
