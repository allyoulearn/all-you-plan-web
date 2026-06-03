<template>
  <div class="import-view">
    <AppScreenHeading
      eyebrow="System · Import"
      title="Move your data"
      emphasis="into Plan"
    />

    <AppSectionHeader label="Source" />

    <div class="import-view__card">
      <label>
        Source app
        <select v-model="source">
          <option value="todoist">
            Todoist (JSON export)
          </option>

          <option value="things">
            Things (JSON export)
          </option>

          <option value="apple_reminders">
            Apple Reminders (.ics)
          </option>

          <option value="json_backup">
            Plan backup (previous export)
          </option>
        </select>
      </label>

      <label>
        Paste the export contents
        <textarea
          v-model="payload"
          rows="12"
          spellcheck="false"
          :placeholder="placeholderForSource"
        />
      </label>

      <AppButton variant="primary" :disabled="busy || !payload" @click="onImport">
        {{ busy ? 'Importing…' : 'Import' }}
      </AppButton>
    </div>

    <AppSectionHeader v-if="result" label="Result" />

    <div v-if="result" class="import-view__card">
      <p>
        Imported {{ result.importedTasks }} tasks and
        {{ result.importedProjects }} projects.
        <span v-if="result.failedCount > 0">
          {{ result.failedCount }} row(s) failed.
        </span>
      </p>

      <ul v-if="result.failed?.length">
        <li v-for="(f, idx) in result.failed" :key="idx">
          Row {{ f.index }}<span v-if="f.label">
            — {{ f.label }}
          </span>:
          {{ f.reason }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
/**
 * ImportView — Phase 4 Item F UI for the bulk-import surface. Pastes the
 * raw export text into a textarea and dispatches `bulkImportFromSource`.
 * Renders the per-item error list so the user can fix the bad rows and
 * re-try without duplicates.
 */
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { apolloClient } from '@/api/apollo.js'
import { BULK_IMPORT_FROM_SOURCE } from '@/api/operations/imports.js'
import AppScreenHeading from '@/components/ui/AppScreenHeading.vue'
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'

const PLACEHOLDERS = {
  todoist:
    '{"projects": [...], "items": [...]} — paste the JSON from Todoist Settings → Backups',
  things:
    '[{ "type": "to-do", "attributes": { "title": "...", "notes": "..." } }] — paste the Things 3 JSON export',
  apple_reminders:
    'BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VTODO\nSUMMARY:Pick up groceries\nEND:VTODO\nEND:VCALENDAR',
  json_backup:
    'Paste the JSON archive from a previous Plan export (Privacy → Data export).'
}

export default {
  name: 'ImportView',
  components: { AppScreenHeading, AppSectionHeader, AppButton },
  setup() {
    const source = ref('todoist')
    const payload = ref('')
    const busy = ref(false)
    const result = ref(null)

    const placeholderForSource = computed(() => PLACEHOLDERS[source.value] ?? '')

    return { source, payload, busy, result, placeholderForSource, onImport }

    async function onImport() {
      busy.value = true
      result.value = null

      try {
        const { data } = await apolloClient.mutate({
          mutation: BULK_IMPORT_FROM_SOURCE,
          variables: { source: source.value, payload: payload.value }
        })

        result.value = data?.bulkImportFromSource ?? null

        if (result.value) {
          toast.success(
            `Imported ${result.value.importedTasks} tasks, ${result.value.importedProjects} projects`
          )
        }
      } catch (err) {
        toast.error('Import failed', { description: err?.message })
      } finally {
        busy.value = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.import-view {
  &__card {
    @apply mt-2 flex flex-col gap-3 rounded-[14px] p-5;
    background: var(--paper-2);
    border: 1px solid var(--rule-soft);

    label {
      @apply flex flex-col gap-1.5 text-[12px];
      color: var(--ink-2);
    }

    select,
    textarea {
      @apply w-full rounded-xl border border-rule-soft px-3 py-2 text-[13px];
      background: var(--paper);
      color: var(--ink);
    }

    textarea {
      @apply font-mono;
    }

    p {
      @apply m-0 text-[13px] leading-snug;
      color: var(--ink-2);
    }

    ul {
      @apply m-0 list-disc pl-5 text-[12px];
      color: var(--ink-2);
    }
  }
}
</style>
