<template>
  <div>
    <ScreenHeading
      eyebrow="Looking back · Journal"
      title="Notes to"
      emphasis="yourself."
    />

    <div v-if="store.loading" class="journal-view__status">
      {{ t('common.loading') }}
    </div>

    <div v-else-if="store.error" class="journal-view__status journal-view__status--error">
      {{ store.error }}
    </div>

    <!-- Today's prompt card -->
    <Card>
      <p class="journal-view__prompt-label">
        {{ t('journal.promptLabel') }}
      </p>

      <p class="journal-view__prompt-text">
        {{ prompt }}
      </p>

      <label for="journal-editor" class="sr-only">
        {{ t('journal.editorLabel') }}
      </label>

      <textarea
        id="journal-editor"
        v-model="bodyText"
        rows="4"
        :placeholder="t('journal.placeholder')"
        :aria-label="t('journal.editorLabel')"
        class="journal-view__editor"
      />

      <div class="journal-view__save-row">
        <Button
          variant="primary"
          :disabled="!bodyText.trim() || saving"
          @click="saveEntry"
        >
          {{ t('journal.saveEntry') }}
        </Button>
      </div>
    </Card>

    <!-- Entries list -->
    <SectionHeader :label="t('journal.entriesSection')" :count="store.entries.length" />

    <div v-if="store.entries.length === 0 && !store.loading" class="journal-view__status">
      {{ t('journal.emptyState') }}
    </div>

    <div class="journal-view__entries">
      <div
        v-for="entry in store.entries"
        :key="entry.id"
        class="journal-view__entry"
      >
        <!-- Date column -->
        <div class="journal-view__entry-date">
          <span class="journal-view__entry-day">
            {{ dayNumber(entry.date) }}
          </span>

          <span class="journal-view__entry-month">
            {{ formatDate(entry.date) }}
          </span>
        </div>

        <!-- Content column -->
        <div class="journal-view__entry-content">
          <p v-if="entry.pullQuote" class="journal-view__pull-quote">
            {{ entry.pullQuote }}
          </p>

          <p class="journal-view__entry-body">
            {{ entry.body }}
          </p>

          <div v-if="entry.tags && entry.tags.length" class="journal-view__tags">
            <Pill v-for="tag in entry.tags" :key="tag">
              {{ tag }}
            </Pill>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/** JournalView — daily prompt with a save form and a chronological entries list. */
import { onMounted, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useJournalStore } from '@/stores/journal.store.js'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Pill from '@/components/ui/Pill.vue'

export default {
  name: 'JournalView',
  components: { ScreenHeading, SectionHeader, Button, Card, Pill },
  setup() {
    // -- State --
    const store = useJournalStore()
    const { t } = useI18n()
    const bodyText = ref('')
    const saving = ref(false)

    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    /** Localised daily prompt (WEB-W4-07). */
    const prompt = computed(() => t('journal.prompt'))

    // -- Lifecycle --
    onMounted(() => store.load())

    // -- Function definitions --

    /**
     * Derives a short pull-quote from the first eight words of entry text.
     * Returns `undefined` for blank input so the server doesn't receive an
     * empty pullQuote field; appends an ellipsis when the source had more
     * than 8 words to make the truncation visible (WEB-W4-33).
     * @param {string} text
     * @returns {string|undefined}
     */
    function pullQuoteFrom(text) {
      const trimmed = (text ?? '').trim()
      if (!trimmed) return undefined
      const words = trimmed.split(/\s+/)
      if (words.length === 0) return undefined
      const head = words.slice(0, 8).join(' ')
      return words.length > 8 ? `${head}…` : head
    }

    /** Saves the current editor text as a new journal entry. */
    async function saveEntry() {
      if (!bodyText.value.trim()) return
      saving.value = true
      try {
        const pullQuote = pullQuoteFrom(bodyText.value)
        const entry = {
          date: todayStr,
          prompt: prompt.value,
          body: bodyText.value.trim(),
          tags: []
        }
        if (pullQuote !== undefined) entry.pullQuote = pullQuote
        await store.createEntry(entry)
        bodyText.value = ''
      } finally {
        saving.value = false
      }
    }

    /**
     * Extracts the numeric day from a YYYY-MM-DD date string. Tolerates a full
     * ISO 8601 timestamp (e.g. "2026-05-20T03:00:00.000Z") by reading only the
     * date portion.
     * @param {string} dateStr
     * @returns {number}
     */
    function dayNumber(dateStr) {
      return Number(dateStr?.slice(0, 10).split('-')[2] ?? 0)
    }

    /**
     * Formats a YYYY-MM-DD (or full ISO) date string as "Mon YYYY" in the
     * browser's locale (WEB-W4-07).
     * @param {string} dateStr
     * @returns {string}
     */
    function formatDate(dateStr) {
      if (!dateStr) return ''
      const [y, m, d] = dateStr.slice(0, 10).split('-')
      const date = new Date(Number(y), Number(m) - 1, Number(d))
      return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    }

    return { t, prompt, store, bodyText, saving, saveEntry, dayNumber, formatDate }
  }
}
</script>

<style lang="scss" scoped>
.journal-view {
  &__status {
    @apply text-[13px] text-muted;

    &--error {
      @apply text-bad;
    }
  }

  &__prompt-label {
    @apply font-mono text-[10px] uppercase tracking-[0.12em] text-muted;
  }

  &__prompt-text {
    @apply font-serif text-[18px] italic leading-snug text-ink;
  }

  &__editor {
    @apply mt-1 w-full resize-none rounded-sm border border-rule-soft bg-paper px-3 py-2.5;
    @apply font-serif text-[15px] text-ink placeholder:text-muted outline-none focus:border-muted;
  }

  &__save-row {
    @apply flex justify-end;
  }

  &__entries {
    @apply flex flex-col gap-4;
  }

  &__entry {
    @apply grid grid-cols-[64px_1fr] gap-5 rounded-md bg-paper-2 p-5 shadow-sm;
  }

  &__entry-date {
    @apply flex flex-col items-center pt-0.5;
  }

  &__entry-day {
    @apply font-serif text-[36px] italic leading-none text-ink;
  }

  &__entry-month {
    @apply mt-1 font-mono text-[10px] text-muted;
  }

  &__entry-content {
    @apply flex flex-col gap-2;
  }

  &__pull-quote {
    @apply font-serif text-[16px] italic leading-snug text-ink;
  }

  &__entry-body {
    @apply text-[13px] leading-relaxed text-ink-2;
  }

  &__tags {
    @apply flex flex-wrap gap-1.5;
  }
}
</style>
