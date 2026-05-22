<template>
  <div>
    <ScreenHeading
      eyebrow="Looking back · Journal"
      title="Notes to"
      emphasis="yourself."
    />

    <div v-if="store.loading" class="journal-view__status">
      Loading…
    </div>

    <div v-else-if="store.error" class="journal-view__status journal-view__status--error">
      {{ store.error }}
    </div>

    <!-- Today's prompt card -->
    <Card>
      <p class="journal-view__prompt-label">
        Today's prompt
      </p>

      <p class="journal-view__prompt-text">
        {{ PROMPT }}
      </p>

      <textarea
        v-model="bodyText"
        rows="4"
        placeholder="Write something…"
        class="journal-view__editor"
      />

      <div class="journal-view__save-row">
        <Button
          variant="primary"
          :disabled="!bodyText.trim() || saving"
          @click="saveEntry"
        >
          Save entry
        </Button>
      </div>
    </Card>

    <!-- Entries list -->
    <SectionHeader label="Entries" :count="store.entries.length" />

    <div v-if="store.entries.length === 0 && !store.loading" class="journal-view__status">
      No entries yet. Write your first one above.
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
import { onMounted, ref } from 'vue'
import { useJournalStore } from '@/stores/journal.store.js'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Pill from '@/components/ui/Pill.vue'

const PROMPT = 'What did you do today that you are quietly proud of?'

export default {
  name: 'JournalView',
  components: { ScreenHeading, SectionHeader, Button, Card, Pill },
  setup() {
    // -- State --
    const store = useJournalStore()
    const bodyText = ref('')
    const saving = ref(false)

    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    // -- Lifecycle --
    onMounted(() => store.load())

    // -- Function definitions --

    /**
     * Derives a short pull-quote from the first eight words of entry text.
     * @param {string} text
     * @returns {string}
     */
    function pullQuoteFrom(text) {
      const words = text.trim().split(/\s+/)
      return words.slice(0, 8).join(' ')
    }

    /** Saves the current editor text as a new journal entry. */
    async function saveEntry() {
      if (!bodyText.value.trim()) return
      saving.value = true
      try {
        await store.createEntry({
          date: todayStr,
          prompt: PROMPT,
          pullQuote: pullQuoteFrom(bodyText.value),
          body: bodyText.value.trim(),
          tags: [],
        })
        bodyText.value = ''
      } finally {
        saving.value = false
      }
    }

    /**
     * Extracts the numeric day from a YYYY-MM-DD date string.
     * @param {string} dateStr
     * @returns {number}
     */
    function dayNumber(dateStr) {
      return Number(dateStr?.split('-')[2] ?? 0)
    }

    /**
     * Formats a YYYY-MM-DD date string as "Mon YYYY".
     * @param {string} dateStr
     * @returns {string}
     */
    function formatDate(dateStr) {
      if (!dateStr) return ''
      const [y, m, d] = dateStr.split('-')
      const date = new Date(Number(y), Number(m) - 1, Number(d))
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }

    return { PROMPT, store, bodyText, saving, saveEntry, dayNumber, formatDate }
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
