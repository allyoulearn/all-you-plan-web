<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <div v-if="open" class="cap" @click="close">
      <!-- Capture card -->
      <div class="cap__card" @click.stop>
        <!-- Header: target label + close button. The shortcut that opens
             this sheet (⌘⇧Space) used to render as three inert kbd chips
             here — they looked clickable but were not, so swap in a real
             close affordance the user can actually hit. -->
        <div class="cap__top">
          <span class="cap__from">
            {{ targetLabel }}
          </span>

          <button
            type="button"
            class="cap__close"
            :aria-label="$t('common.close')"
            @click="close"
          >
            <AppIcon name="x" :size="16" />
          </button>
        </div>

        <!-- Capture textarea -->
        <textarea
          ref="taRef"
          v-model="text"
          class="cap__textarea"
          :placeholder="$t('capture.placeholder')"
          @keydown="onKey"
        />

        <!-- Actions row -->
        <div class="cap__actions">
          <!-- Target pills -->
          <div class="cap__pills">
            <button
              v-for="t in targets"
              :key="t.id"
              type="button"
              :class="['cap__pill', { 'cap__pill--active': target === t.id }]"
              @click="target = t.id"
            >
              <AppIcon :name="t.icon" :size="11" />
              {{ t.label }}
            </button>
          </div>

          <!-- Save button. The ⌘↵ shortcut lives inside the button so the
               trigger and its hint sit together; previously the keyboard
               hint was a separate cramped strip that repeated the word
               "Save" right next to the button. Esc-to-close is the standard
               modal contract and no longer needs its own visible label. -->
          <button type="button" class="cap__save" @click="save">
            <span>
              {{ $t('capture.save') }}
            </span>

            <span class="cap__save-kbd" aria-hidden="true">
              ⌘↵
            </span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
/**
 * Cmd+Shift+Space quick-capture sheet. Saves to inbox by default; pill row
 * lets the user redirect to today, a specific project, or as a chore.
 * Voice/share targets live on mobile only — this surface is keyboard-first.
 */
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOverlaysStore } from '@/stores/overlays.store.js'
import { useInboxStore } from '@/stores/inbox.store.js'
import AppIcon from '@/components/ui/AppIcon.vue'

export default {
  name: 'CaptureOverlay',
  components: { AppIcon },
  setup() {
    const { t } = useI18n()
    const overlays = useOverlaysStore()
    const inbox = useInboxStore()
    const taRef = ref(null)
    const text = ref('')
    const target = ref('inbox')

    /** Mirror of `overlays.captureOpen`; drives the Teleported sheet visibility. */
    const open = computed(() => overlays.captureOpen)

    /** Localised target pills (inbox / today / memoir / chore). */
    const targets = computed(() => [
      { id: 'inbox', label: t('capture.targetInboxLabel'), icon: 'inbox' },
      { id: 'today', label: t('capture.targetTodayLabel'), icon: 'today' },
      { id: 'memoir', label: t('capture.targetMemoirLabel'), icon: 'projects' },
      { id: 'chore', label: t('capture.targetChoreLabel'), icon: 'chores' }
    ])

    /** Header eyebrow string; "Inbox" by default, "Forward to <target>" when redirected. */
    const targetLabel = computed(() =>
      target.value === 'inbox'
        ? t('capture.headerInbox')
        : t('capture.headerForward', { target: target.value })
    )

    watch(open, async isOpen => {
      if (isOpen) {
        text.value = overlays.captureSeed ?? ''
        target.value = 'inbox'
        await nextTick()
        taRef.value?.focus()
        window.addEventListener('keydown', windowKey)
      } else {
        window.removeEventListener('keydown', windowKey)
      }
    })

    return { open, text, target, targets, targetLabel, taRef, close, save, onKey }

    // -- Function definitions --

    /** Close the overlay via the overlays store. */
    function close() {
      overlays.closeCapture()
    }

    /** Persist the typed text to inbox, clear, and close. No-ops on empty text. */
    async function save() {
      const value = text.value.trim()

      if (!value) {
        close()
        return
      }

      try {
        await inbox.capture(value)
      } catch {
        /* inbox.capture() already surfaced a toast via useErrorToast — keep the
           sheet behaviour identical (clear + close) so a transient failure does
           not strand the user mid-thought. */
      }

      text.value = ''
      close()
    }

    /** Textarea keydown: Esc closes, Cmd/Ctrl+Enter saves. */
    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }

      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        save()
      }
    }

    /** Window-level keydown: only handles Escape so the overlay can close when the textarea isn't focused. */
    function windowKey(e) {
      if (!open.value) return

      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.cap {
  @apply fixed inset-0 z-50 flex items-start justify-center pt-[30vh];
  background: color-mix(in oklab, var(--ink) 35%, transparent);
  backdrop-filter: blur(2px);

  &__card {
    @apply rounded-[22px] p-5 pt-6;
    width: min(600px, 92vw);
    background: var(--paper-2);
    box-shadow: 0 30px 80px -20px rgba(20, 18, 12, 0.4);
  }

  &__top {
    @apply mb-4 flex items-center gap-3.5;
  }
  &__from {
    @apply font-mono uppercase;
    color: var(--muted);
    font-size: 10px;
    letter-spacing: 0.14em;
  }
  &__close {
    @apply ml-auto inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-rule-soft transition-colors;
    color: var(--muted);

    &:hover {
      background: var(--paper-3);
      color: var(--ink);
    }
  }

  &__textarea {
    @apply min-h-[100px] w-full resize-none bg-transparent font-serif italic outline-none;
    color: var(--ink);
    font-size: 26px;
    line-height: 1.35;

    &::placeholder { color: var(--muted); }
  }

  &__actions {
    @apply mt-3 flex items-center gap-2 border-t border-rule-soft pt-2;
  }
  &__pills { @apply flex flex-1 flex-wrap gap-1.5; }
  &__pill {
    @apply inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-rule-soft px-2.5 py-1.5 text-xs;
    color: var(--muted);

    &--active {
      background: var(--paper-3);
      border-color: var(--ink);
      color: var(--ink);
    }
  }
  &__save {
    @apply inline-flex cursor-pointer items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-medium;
    background: var(--ink);
    color: var(--paper);
  }
  &__save-kbd {
    @apply rounded px-1.5 py-0.5 font-mono text-[10px];
    background: color-mix(in oklab, var(--paper) 18%, transparent);
    color: var(--paper);
  }
}
</style>
