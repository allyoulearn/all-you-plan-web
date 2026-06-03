<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <div v-if="open" class="overlay" @click="close">
      <!-- Palette card -->
      <div class="overlay__card" @click.stop>
        <!-- Search input header -->
        <div class="overlay__head">
          <AppIcon name="search" :size="18" />

          <input
            ref="inputEl"
            v-model="query"
            class="overlay__input"
            :placeholder="$t('search.placeholder')"
            @input="onInput"
          />

          <span class="overlay__kbd">
            esc
          </span>
        </div>

        <!-- Results body -->
        <div class="overlay__body">
          <!-- Empty-query state: recent + quick actions -->
          <template v-if="!query.trim()">
            <!-- Recent queries -->
            <div class="overlay__group-h">
              {{ $t('search.recent') }}
              <span class="overlay__group-ct">
                {{ recent.length }}
              </span>
            </div>

            <button
              v-for="r in recent"
              :key="r"
              type="button"
              class="overlay__row"
              @click="useRecent(r)"
            >
              <span class="overlay__badge">
                {{ $t('search.recent') }}
              </span>

              <span class="overlay__row-text">
                {{ r }}
              </span>

              <AppIcon name="arrow-right" :size="14" />
            </button>

            <!-- Quick actions -->
            <div class="overlay__group-h">
              {{ $t('search.quickActions') }}
            </div>

            <button type="button" class="overlay__row overlay__row--sel" @click="openCapture">
              <span class="overlay__badge">
                ⌘ N
              </span>

              <span class="overlay__row-text">
                {{ $t('search.captureQuick') }}
              </span>

              <span class="overlay__kbd">
                ⌘ ⇧ Space
              </span>
            </button>

            <button type="button" class="overlay__row" @click="navigate('wren')">
              <span class="overlay__badge">
                ⌘ K
              </span>

              <span class="overlay__row-text">
                {{ $t('search.planWithWren') }}
              </span>
            </button>

            <button type="button" class="overlay__row" @click="navigate('review')">
              <span class="overlay__badge">
                ⌘ R
              </span>

              <span class="overlay__row-text">
                {{ $t('search.startReview') }}
              </span>
            </button>
          </template>

          <!-- Active-query state: grouped hits + capture fallback -->
          <template v-else>
            <!-- Result groups -->
            <template v-for="g in groups" :key="g.id">
              <template v-if="g.items.length">
                <div class="overlay__group-h">
                  <span>
                    {{ g.label }}
                  </span>

                  <span class="overlay__group-ct">
                    [{{ g.items.length }}]
                  </span>
                </div>

                <button
                  v-for="(r, i) in g.items"
                  :key="r.id"
                  type="button"
                  :class="['overlay__row', { 'overlay__row--sel': g.id === 'tasks' && i === 0 }]"
                  @click="openHit(r, g.id)"
                >
                  <span class="overlay__badge">
                    {{ g.label }}
                  </span>

                  <span class="overlay__row-text">
                    <!-- eslint-disable-next-line vue/no-v-html -- mark() HTML-escapes input before inserting <mark>; safe. -->
                    <span v-html="mark(r.title)" />

                    <!-- eslint-disable-next-line vue/no-v-html -- mark() HTML-escapes input before inserting <mark>; safe. -->
                    <span class="overlay__row-sub" v-html="mark(r.snippet)" />
                  </span>

                  <span v-if="r.projectTag" class="overlay__row-tag">
                    {{ r.projectTag }}
                  </span>

                  <span v-if="r.when" class="overlay__row-when">
                    {{ r.when }}
                  </span>
                </button>
              </template>
            </template>

            <!-- Capture-as-inbox fallback -->
            <div class="overlay__group-h overlay__group-h--mt">
              {{ $t('search.notFound') }}
            </div>

            <button type="button" class="overlay__row" @click="captureQuery">
              <span class="overlay__badge">
                {{ $t('search.capture') }}
              </span>

              <span class="overlay__row-text overlay__row-text--muted">
                {{ $t('search.captureAsInbox', { q: query }) }}
              </span>

              <AppIcon name="plus" :size="14" />
            </button>
          </template>
        </div>

        <!-- Keyboard hint footer -->
        <div class="overlay__foot">
          <span class="overlay__ki">
            <span class="overlay__kbd">
              ↑↓
            </span> {{ $t('search.navigate') }}
          </span>

          <span class="overlay__ki">
            <span class="overlay__kbd">
              ↵
            </span> {{ $t('search.open') }}
          </span>

          <span class="overlay__spacer" />

          <span class="overlay__ki">
            {{ $t('search.p95') }}
          </span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
/**
 * Cmd+K search palette. Streams results from the search store as the user
 * types (debounced). Empty query shows the recent-queries list + quick
 * actions; non-empty shows seven domain buckets.
 */
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useSearchStore } from '@/stores/search.store.js'
import { useOverlaysStore } from '@/stores/overlays.store.js'
import AppIcon from '@/components/ui/AppIcon.vue'

export default {
  name: 'SearchOverlay',
  components: { AppIcon },
  setup() {
    const { t } = useI18n()
    const searchStore = useSearchStore()
    const overlays = useOverlaysStore()
    const router = useRouter()
    const inputEl = ref(null)
    const query = ref('')
    let debounceTimer = null

    /** Mirror of `overlays.searchOpen`; drives the Teleported palette visibility. */
    const open = computed(() => overlays.searchOpen)
    /** List of recently-used search queries from the search store. */
    const recent = computed(() => searchStore.results.recent ?? [])

    /** The seven result buckets rendered when the query is non-empty. */
    const groups = computed(() => [
      { id: 'tasks', label: t('search.groupTasks'), items: searchStore.results.tasks ?? [] },
      { id: 'projects', label: t('search.groupProjects'), items: searchStore.results.projects ?? [] },
      { id: 'chores', label: t('search.groupChores'), items: searchStore.results.chores ?? [] },
      { id: 'inbox', label: t('search.groupInbox'), items: searchStore.results.inbox ?? [] },
      { id: 'journal', label: t('search.groupJournal'), items: searchStore.results.journal ?? [] },
      { id: 'calendar', label: t('search.groupCalendar'), items: searchStore.results.calendar ?? [] },
      { id: 'wren', label: t('search.groupWrenMemory'), items: searchStore.results.wren ?? [] }
    ])

    watch(open, async isOpen => {
      if (isOpen) {
        query.value = ''
        searchStore.search('')
        await nextTick()
        inputEl.value?.focus()
        window.addEventListener('keydown', onKey)
      } else {
        window.removeEventListener('keydown', onKey)
      }
    })

    return { open, query, recent, groups, inputEl, mark, close, onInput, navigate, openCapture, captureQuery, openHit, useRecent }

    // -- Function definitions --

    /**
     * Highlights the current query inside `text` by wrapping matches in
     * `<mark>` tags. The escape-then-substitute order is load-bearing: the
     * raw text is HTML-escaped first (so any user-controlled `<`, `>`, `&`,
     * `"` cannot inject markup), and only then are the safe `<mark>` tags
     * spliced in around literal query matches. This is what makes the
     * v-html sites that consume `mark()` safe to render.
     */
    function mark(text) {
      const q = query.value.trim()
      const safe = String(text ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
      if (!q) return safe
      const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig')
      return safe.replace(re, '<mark>$1</mark>')
    }

    /** Close the search overlay via the overlays store. */
    function close() {
      overlays.closeSearch()
    }

    /** Debounced input handler — fires `searchStore.search` 120ms after the last keystroke. */
    function onInput() {
      clearTimeout(debounceTimer)

      debounceTimer = setTimeout(() => {
        searchStore.search(query.value)
      }, 120)
    }

    /**
     * Close the overlay and route the app to the named view.
     * @param {string} name Vue Router route name.
     */
    function navigate(name) {
      close()
      router.push({ name })
    }

    /** Close the overlay and open the capture sheet with an empty seed. */
    function openCapture() {
      close()
      overlays.openCapture()
    }

    /** Close the overlay and open the capture sheet seeded with the current query. */
    function captureQuery() {
      const seed = query.value
      close()
      overlays.openCapture(seed)
    }

    /**
     * Close the overlay and route the user to the appropriate detail surface
     * for a clicked search hit.
     * @param {object} hit
     * @param {string} kind One of the result-group ids.
     */
    function openHit(hit, kind) {
      close()
      if (kind === 'tasks') router.push({ name: 'today' })
      else if (kind === 'projects') router.push({ name: 'projects' })
      else if (kind === 'chores') router.push({ name: 'chores' })
      else if (kind === 'inbox') router.push({ name: 'inbox' })
      else if (kind === 'journal') router.push({ name: 'journal' })
      else if (kind === 'calendar') router.push({ name: 'calendar' })
      else router.push({ name: 'wren' })
    }

    /** Re-run a click-recalled recent query through the search store. */
    function useRecent(text) {
      query.value = text
      searchStore.search(text)
    }

    /** Window keydown handler: Escape closes the overlay when it's open. */
    function onKey(e) {
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
.overlay {
  @apply fixed inset-0 z-50 grid place-items-start justify-center pt-[14vh];
  background: color-mix(in oklab, var(--ink) 35%, transparent);
  backdrop-filter: blur(2px);

  &__card {
    @apply flex flex-col overflow-hidden rounded-[18px];
    width: min(680px, 92vw);
    background: var(--paper-2);
    box-shadow: 0 30px 80px -20px rgba(20, 18, 12, 0.35), 0 0 0 1px var(--rule-soft);
  }
  &__head {
    @apply flex items-center gap-3 border-b border-rule-soft px-5 py-3.5;
    color: var(--muted);
  }
  &__input {
    @apply flex-1 bg-transparent py-2 font-sans outline-none;
    color: var(--ink);
    font-size: 17px;

    &::placeholder { color: var(--muted); }
  }
  &__kbd {
    @apply rounded-md border border-rule-soft px-1.5 py-0.5 font-mono text-[10px];
    color: var(--muted);
  }

  &__body {
    @apply px-1.5 pb-3 pt-2;
    max-height: 56vh;
    overflow-y: auto;
  }

  &__group-h {
    @apply flex items-baseline gap-2 px-3.5 pb-1.5 pt-2.5 font-mono uppercase;
    color: var(--muted);
    font-size: 10px;
    letter-spacing: 0.14em;

    &--mt { @apply mt-2.5; }
  }
  &__group-ct {
    color: var(--muted);
  }

  &__row {
    @apply flex w-full cursor-pointer items-center gap-3.5 rounded-[10px] px-3.5 py-2.5 text-left;

    &:hover { background: var(--paper-3); }
    &--sel { background: var(--paper-3); outline: 1px solid var(--rule-soft); }
  }
  &__badge {
    @apply flex-none font-mono uppercase;
    color: var(--muted);
    font-size: 9px;
    letter-spacing: 0.14em;
    width: 64px;
  }
  &__row-text {
    @apply flex-1 text-[14px];

    :deep(mark) {
      background: color-mix(in oklab, var(--accent) 25%, transparent);
      color: var(--ink);
      padding: 0 2px;
      border-radius: 2px;
    }
    &--muted { color: var(--muted); }
  }
  &__row-sub {
    @apply mt-0.5 block text-xs;
    color: var(--muted);
  }
  &__row-tag {
    @apply rounded-full border border-rule-soft px-2 py-0.5 text-[10px];
    color: var(--muted);
  }
  &__row-when {
    @apply font-mono text-[10px];
    color: var(--muted);
    letter-spacing: 0.04em;
  }

  &__foot {
    @apply flex items-center gap-3.5 border-t border-rule-soft px-5 py-2 text-[11px];
    color: var(--muted);
  }
  &__ki { @apply inline-flex items-center gap-1.5; }
  &__spacer { @apply flex-1; }
}
</style>
