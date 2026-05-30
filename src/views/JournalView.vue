<template>
  <div>
    <AppScreenHeading
      :eyebrow="`${t('nav.lookingBack')} · ${t('nav.itemJournal')}`"
      :title="t('journal.headingPrefix')"
      :emphasis="t('journal.headingEmphasis')"
    />

    <div v-if="store.loading" class="journal-view__status">
      {{ t('common.loading') }}
    </div>

    <div v-else-if="store.error" class="journal-view__status journal-view__status--error">
      {{ store.error }}
    </div>

    <!-- Today's prompt card -->
    <AppCard>
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

      <div class="journal-view__composer-footer">
        <div class="journal-view__tag-area">
          <AppIcon
            name="tag"
            :size="14"
            class="journal-view__tag-icon"
            aria-hidden="true"
          />

          <ul v-if="composeTags.length" class="journal-view__compose-tags">
            <li v-for="tag in composeTags" :key="tag" class="journal-view__compose-tag">
              <span>
                {{ tag }}
              </span>

              <button
                type="button"
                class="journal-view__compose-tag-remove"
                :aria-label="t('common.delete')"
                @click="removeComposeTag(tag)"
              >
                <AppIcon name="x" :size="10" />
              </button>
            </li>
          </ul>

          <input
            v-model="tagInput"
            type="text"
            class="journal-view__tag-input"
            :placeholder="t('journal.tagPlaceholder')"
            @keydown="onTagInputKeydown"
            @blur="commitTagInput"
          >
        </div>

        <AppButton
          variant="primary"
          :disabled="!bodyText.trim() || saving"
          @click="saveEntry"
        >
          {{ t('journal.saveEntry') }}
        </AppButton>
      </div>
    </AppCard>

    <!-- Entries list with tag filter pill row -->
    <AppSectionHeader :label="t('journal.entriesSection')" :count="store.entries.length" />

    <div v-if="availableTags.length" class="journal-view__filter">
      <button
        type="button"
        class="journal-view__filter-pill"
        :class="{ 'journal-view__filter-pill--active': !activeTag }"
        @click="setActiveTag(null)"
      >
        {{ t('journal.filterAll') }}
      </button>

      <button
        v-for="tag in availableTags"
        :key="tag"
        type="button"
        class="journal-view__filter-pill"
        :class="{ 'journal-view__filter-pill--active': activeTag === tag }"
        @click="setActiveTag(tag)"
      >
        {{ tag }}
      </button>
    </div>

    <div v-if="store.entries.length === 0 && !store.loading" class="journal-view__empty">
      {{ activeTag ? t('journal.emptyFiltered') : t('journal.emptyState') }}
    </div>

    <div v-else class="journal-view__entries">
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
          <div v-if="entry.pullQuote" class="journal-view__pull-quote-row">
            <p class="journal-view__pull-quote">
              {{ entry.pullQuote }}
            </p>

            <WrenOriginBadge ref-type="journal_entry" :ref-id="entry.id" />
          </div>

          <WrenOriginBadge
            v-if="!entry.pullQuote"
            ref-type="journal_entry"
            :ref-id="entry.id"
            class="journal-view__inline-badge"
          />

          <p class="journal-view__entry-body">
            {{ entry.body }}
          </p>

          <div v-if="entry.tags && entry.tags.length" class="journal-view__tags">
            <button
              v-for="tag in entry.tags"
              :key="tag"
              type="button"
              class="journal-view__tag-button"
              @click="setActiveTag(tag)"
            >
              <AppPill>
                {{ tag }}
              </AppPill>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * JournalView — daily prompt with a save form, a chronological entries list,
 * and a tag filter row. Compose-time tags are added by typing + Enter (or
 * comma), removed via the X on each chip. The filter row aggregates every
 * unique tag across recently loaded entries; clicking a pill triggers a
 * server-side refetch with the tag arg so the result set stays accurate
 * even after paging.
 */
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useJournalStore } from '@/stores/journal.store.js'
import AppScreenHeading from '@/components/ui/AppScreenHeading.vue'
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppPill from '@/components/ui/AppPill.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import WrenOriginBadge from '@/components/wren/WrenOriginBadge.vue'
import { localISOToday } from '@/utils/date.js'

export default {
  name: 'JournalView',
  components: { AppScreenHeading, AppSectionHeader, AppButton, AppCard, AppPill, AppIcon, WrenOriginBadge },
  setup() {
    const store = useJournalStore()
    const { t } = useI18n()
    const bodyText = ref('')
    const tagInput = ref('')
    const composeTags = ref([])
    const saving = ref(false)
    const activeTag = ref(null)
    /** Tags discovered across all loaded entries — used to populate the
     *  filter pill row. We keep a separate ref (rather than re-computing
     *  from `store.entries`) so filtering doesn't shrink the pill row to
     *  only the active tag. */
    const knownTags = ref([])

    const todayStr = localISOToday()

    const prompt = computed(() => t('journal.prompt'))

    const availableTags = computed(() => [...knownTags.value].sort())

    onMounted(async () => {
      await store.load()
      rememberTagsFrom(store.entries)
    })

    return {
      t,
      prompt,
      store,
      bodyText,
      tagInput,
      composeTags,
      saving,
      activeTag,
      availableTags,
      saveEntry,
      commitTagInput,
      onTagInputKeydown,
      removeComposeTag,
      setActiveTag,
      dayNumber,
      formatDate
    }

    // -- Function definitions --

    /**
     * Union the tags from a list of entries into the knownTags set used by
     * the filter pill row.
     * @param {Array<{ tags?: string[] }>} entries
     */
    function rememberTagsFrom(entries) {
      const set = new Set(knownTags.value)

      for (const entry of entries ?? []) {
        for (const tag of entry.tags ?? []) set.add(tag)
      }

      knownTags.value = [...set]
    }

    /** Push the current tag input value into composeTags as a chip. */
    function commitTagInput() {
      const value = tagInput.value.trim().replace(/,$/, '').trim()

      if (!value) {
        tagInput.value = ''
        return
      }

      if (!composeTags.value.includes(value)) {
        composeTags.value = [...composeTags.value, value]
      }

      tagInput.value = ''
    }

    /** Commit on Enter or comma — Vue's v-on doesn't recognize a `.comma`
     *  modifier, so we match on the key value directly. */
    function onTagInputKeydown(e) {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault()
        commitTagInput()
      }
    }

    /**
     * Remove a chip from the compose-tags list.
     * @param {string} tag
     */
    function removeComposeTag(tag) {
      composeTags.value = composeTags.value.filter(t => t !== tag)
    }

    /**
     * Set the active filter tag and refetch entries.
     * @param {string|null} tag
     */
    async function setActiveTag(tag) {
      activeTag.value = tag
      await store.load({ tag })
      // Filtered fetches shouldn't shrink the pill row; only union new tags
      // into the existing set.
      rememberTagsFrom(store.entries)
    }

    /**
     * Derive an 8-word pull quote from a body of text. Returns undefined for
     * empty input so callers can omit the field rather than send a null.
     * @param {string|null|undefined} text
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

    /**
     * Persist the current journal entry, committing any pending tag input
     * before saving and resetting the compose state afterwards.
     */
    async function saveEntry() {
      // Commit any tag still sitting in the input before saving.
      commitTagInput()
      if (!bodyText.value.trim()) return
      saving.value = true

      try {
        const pullQuote = pullQuoteFrom(bodyText.value)

        const entry = {
          date: todayStr,
          prompt: prompt.value,
          body: bodyText.value.trim(),
          tags: [...composeTags.value]
        }

        if (pullQuote !== undefined) entry.pullQuote = pullQuote
        await store.createEntry(entry)
        bodyText.value = ''
        composeTags.value = []
        rememberTagsFrom(store.entries)
      } finally {
        saving.value = false
      }
    }

    /**
     * Extract the numeric day-of-month from a YYYY-MM-DD string.
     * @param {string|null|undefined} dateStr
     * @returns {number}
     */
    function dayNumber(dateStr) {
      return Number(dateStr?.slice(0, 10).split('-')[2] ?? 0)
    }

    /**
     * Format a YYYY-MM-DD string as "Mon YYYY".
     * @param {string|null|undefined} dateStr
     * @returns {string}
     */
    function formatDate(dateStr) {
      if (!dateStr) return ''
      const [y, m, d] = dateStr.slice(0, 10).split('-')
      const date = new Date(Number(y), Number(m) - 1, Number(d))
      return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    }
  }
}
</script>

<style lang="scss" scoped>
.journal-view {
  &__status {
    @apply mb-3 text-[13px] text-muted;

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
    @apply mt-1 w-full resize-none rounded-md border border-rule-soft bg-paper px-3 py-2.5;
    @apply font-serif text-[15px] text-ink placeholder:text-muted outline-none focus:border-muted;
  }

  &__composer-footer {
    @apply mt-1 flex flex-wrap items-end justify-between gap-3;
  }

  &__tag-area {
    @apply flex flex-1 flex-wrap items-center gap-2;
  }

  &__tag-icon {
    @apply text-muted;
  }

  &__compose-tags {
    @apply flex flex-wrap items-center gap-1.5;
  }

  &__compose-tag {
    @apply inline-flex items-center gap-1 rounded-pill bg-paper px-2 py-0.5 text-[12px] text-ink;
  }

  &__compose-tag-remove {
    @apply inline-flex h-4 w-4 items-center justify-center rounded-pill text-muted hover:bg-paper-3 hover:text-ink;
  }

  &__tag-input {
    @apply min-w-[140px] flex-1 bg-transparent text-[13px] text-ink placeholder:text-muted focus:outline-none;
  }

  &__filter {
    @apply flex flex-wrap items-center gap-1.5;
  }

  &__filter-pill {
    @apply inline-flex items-center rounded-pill border border-rule-soft bg-paper-2 px-2.5 py-1 text-[12px] text-muted transition-colors hover:bg-paper-3 hover:text-ink;
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;

    &--active {
      @apply bg-ink text-paper hover:bg-ink hover:text-paper;
    }
  }

  &__empty {
    @apply mt-4 rounded-md border border-dashed border-rule-soft bg-paper-2 px-5 py-8 text-center text-[13px] text-muted;
  }

  &__entries {
    @apply mt-4 flex flex-col gap-4;
  }

  &__entry {
    // Phones: tighter padding + narrower date column so the body has room.
    // Restore the comfortable layout from sm+.
    @apply grid grid-cols-[44px_1fr] gap-3 rounded-md bg-paper-2 p-4 shadow-sm sm:grid-cols-[60px_1fr] sm:gap-5 sm:p-5;
  }

  &__entry-date {
    @apply flex flex-col items-center pt-0.5;
  }

  &__entry-day {
    @apply font-serif text-[30px] italic leading-none text-ink;
  }

  &__entry-month {
    @apply mt-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted;
  }

  &__entry-content {
    @apply flex flex-col gap-2;
  }

  &__pull-quote-row {
    @apply flex items-start gap-2;
  }

  &__pull-quote {
    @apply font-serif text-[16px] italic leading-snug text-ink;
  }

  &__inline-badge {
    @apply self-start;
  }

  &__entry-body {
    @apply text-[13px] leading-relaxed text-ink-2;
  }

  &__tags {
    @apply flex flex-wrap gap-1.5;
  }

  &__tag-button {
    @apply inline-flex bg-transparent p-0;
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;
  }
}
</style>
