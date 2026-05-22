<script setup>
import { onMounted, ref, computed } from 'vue'
import { useJournalStore } from '@/stores/journal.store'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Pill from '@/components/ui/Pill.vue'

const store = useJournalStore()
onMounted(() => store.load())

const PROMPT = 'What did you do today that you are quietly proud of?'

const bodyText = ref('')
const saving = ref(false)

const today = new Date()
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

function pullQuoteFrom(text) {
  const words = text.trim().split(/\s+/)
  return words.slice(0, 8).join(' ')
}

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

function dayNumber(dateStr) {
  return Number(dateStr?.split('-')[2] ?? 0)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}
</script>

<template>
  <div>
    <ScreenHeading
      eyebrow="Looking back · Journal"
      title="Notes to"
      emphasis="yourself."
    />

    <div v-if="store.loading" class="text-[13px] text-muted">Loading…</div>
    <div v-else-if="store.error" class="text-[13px] text-bad">{{ store.error }}</div>

    <!-- Today's prompt card -->
    <Card>
      <p class="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
        Today's prompt
      </p>
      <p class="font-serif text-[18px] italic leading-snug text-ink">
        {{ PROMPT }}
      </p>
      <textarea
        v-model="bodyText"
        rows="4"
        placeholder="Write something…"
        class="mt-1 w-full resize-none rounded-sm border border-rule-soft bg-paper px-3 py-2.5 font-serif text-[15px] text-ink placeholder-muted outline-none focus:border-muted dark:bg-paper"
      />
      <div class="flex justify-end">
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

    <div v-if="store.entries.length === 0 && !store.loading" class="text-[13px] text-muted">
      No entries yet. Write your first one above.
    </div>

    <div class="flex flex-col gap-4">
      <div
        v-for="entry in store.entries"
        :key="entry.id"
        class="grid grid-cols-[64px_1fr] gap-5 rounded-md bg-paper-2 p-5 shadow-sm"
      >
        <!-- Date column -->
        <div class="flex flex-col items-center pt-0.5">
          <span class="font-serif text-[36px] italic leading-none text-ink">
            {{ dayNumber(entry.date) }}
          </span>
          <span class="mt-1 font-mono text-[10px] text-muted">
            {{ formatDate(entry.date) }}
          </span>
        </div>

        <!-- Content column -->
        <div class="flex flex-col gap-2">
          <p v-if="entry.pullQuote" class="font-serif text-[16px] italic leading-snug text-ink">
            {{ entry.pullQuote }}
          </p>
          <p class="text-[13px] leading-relaxed text-ink-2">{{ entry.body }}</p>
          <div v-if="entry.tags && entry.tags.length" class="flex flex-wrap gap-1.5">
            <Pill v-for="tag in entry.tags" :key="tag">{{ tag }}</Pill>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
